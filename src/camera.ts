import { initialZoom, zoomThreshold } from './data/constants';
import type { StageDef } from './data/maps';
import type { Marble } from './marble';
import type { VectorLike } from './types/VectorLike';

const cruisingZoom = 0.88;
const finishZoomBoost = 2.2;
const stageLaneSpan = 26;

export class Camera {
  private _position: VectorLike = { x: 0, y: 0 };
  private _targetPosition: VectorLike = { x: 0, y: 0 };
  private _zoom: number = 1;
  private _targetZoom: number = 1;
  private _locked = false;
  private _shouldFollowMarbles = false;
  private _goalY = 0;
  private _reverseFlow = true;
  private _presentation: StageDef['presentation'] = 'default';
  private _activeGoalSpotlightKey: string | null = null;

  get zoom() {
    return this._zoom;
  }
  set zoom(v: number) {
    this._targetZoom = v;
  }

  get x() {
    return this._position.x;
  }
  set x(v: number) {
    this._targetPosition.x = v;
  }
  get y() {
    return this._position.y;
  }
  set y(v: number) {
    this._targetPosition.y = v;
  }

  get position() {
    return this._position;
  }

  setPosition(v: VectorLike, force: boolean = false) {
    if (force) {
      return (this._position = { x: v.x, y: v.y });
    }
    return (this._targetPosition = { x: v.x, y: v.y });
  }

  lock(v: boolean) {
    this._locked = v;
  }

  setFlow(goalY: number, reverseFlow = true, presentation: StageDef['presentation'] = 'default') {
    this._goalY = goalY;
    this._reverseFlow = reverseFlow;
    this._presentation = presentation;
  }

  toVisualY(y: number) {
    return this._reverseFlow ? this._goalY - y : y;
  }

  toWorldY(y: number) {
    return this._reverseFlow ? this._goalY - y : y;
  }

  private _toScenePosition(v: VectorLike, presentation: StageDef['presentation'] = this._presentation) {
    if (presentation === 'side-scroll') {
      return {
        x: v.y,
        y: stageLaneSpan - v.x,
      };
    }

    return {
      x: v.x,
      y: this.toVisualY(v.y),
    };
  }

  private _toWorldPosition(v: VectorLike, presentation: StageDef['presentation'] = this._presentation) {
    if (presentation === 'side-scroll') {
      return {
        x: stageLaneSpan - v.y,
        y: v.x,
      };
    }

    return {
      x: v.x,
      y: this.toWorldY(v.y),
    };
  }

  setWorldPosition(v: VectorLike, stage: StageDef, force = false) {
    this.setPosition(this._toScenePosition(v, stage.presentation), force);
  }

  getViewportCenter(stage: StageDef) {
    return this._toWorldPosition(this._position, stage.presentation);
  }

  startFollowingMarbles() {
    this._shouldFollowMarbles = true;
  }

  initializePosition(stage: StageDef, center?: VectorLike, zoom?: number) {
    const sceneCenter = this._toScenePosition(center ?? { x: 12.95, y: 2 }, stage.presentation);
    const x = sceneCenter.x;
    const y = sceneCenter.y;
    const z = zoom ?? cruisingZoom;

    this._position = { x, y };
    this._targetPosition = { x, y };
    this._zoom = z;
    this._targetZoom = z;
    this._shouldFollowMarbles = false;
  }

  update({
    marbles,
    stage,
    needToZoom,
    targetIndex,
    goalSpotlight,
    goalSpotlightElapsed = 0,
    goalSpotlightDuration = 0,
    winnerSpotlight,
    winnerSpotlightElapsed = 0,
  }: {
    marbles: Marble[];
    stage: StageDef;
    needToZoom: boolean;
    targetIndex: number;
    goalSpotlight?: VectorLike | null;
    goalSpotlightElapsed?: number;
    goalSpotlightDuration?: number;
    winnerSpotlight?: Marble | null;
    winnerSpotlightElapsed?: number;
  }) {
    // set target position
    if (!this._locked) {
      this._calcTargetPositionAndZoom(
        marbles,
        stage,
        needToZoom,
        targetIndex,
        goalSpotlight,
        goalSpotlightElapsed,
        goalSpotlightDuration,
        winnerSpotlight,
        winnerSpotlightElapsed
      );
    }

    // interpolate position
    this._position.x = this._interpolation(this.x, this._targetPosition.x);
    this._position.y = this._interpolation(this.y, this._targetPosition.y);

    // interpolate zoom
    this._zoom = this._interpolation(this._zoom, this._targetZoom);
  }

  private _calcTargetPositionAndZoom(
    marbles: Marble[],
    stage: StageDef,
    needToZoom: boolean,
    targetIndex: number,
    goalSpotlight?: VectorLike | null,
    goalSpotlightElapsed = 0,
    goalSpotlightDuration = 0,
    winnerSpotlight?: Marble | null,
    winnerSpotlightElapsed = 0
  ) {
    if (!this._shouldFollowMarbles) {
      return;
    }

    const targetMarble = winnerSpotlight ?? (marbles[targetIndex] ? marbles[targetIndex] : marbles[0]);
    if (targetMarble) {
      if (goalSpotlight) {
        const spotlightKey = `${stage.presentation}:${goalSpotlight.x.toFixed(2)}:${goalSpotlight.y.toFixed(2)}`;
        const shouldSnapToSpotlight = this._activeGoalSpotlightKey !== spotlightKey || goalSpotlightElapsed <= 26;
        const zoomInProgress = Math.max(0, Math.min(1, goalSpotlightElapsed / 180));
        const holdStart = Math.max(0, goalSpotlightDuration - 220);
        const zoomOutProgress = Math.max(
          0,
          Math.min(
            1,
            holdStart > 0 ? (goalSpotlightElapsed - holdStart) / Math.max(120, goalSpotlightDuration - holdStart) : 0
          )
        );
        const spotlightZoom = cruisingZoom + 0.42 + zoomInProgress * 0.54 - zoomOutProgress * 0.18;
        if (stage.presentation === 'side-scroll') {
          const laneFocus = 13 + (goalSpotlight.x - 13) * 0.34;
          const targetX = Math.min(stage.goalY + 0.5, goalSpotlight.y + 0.65);
          const targetY = stageLaneSpan - laneFocus;
          if (shouldSnapToSpotlight) {
            this._position = { x: targetX, y: targetY };
            this._targetPosition = { x: targetX, y: targetY };
            this._zoom = spotlightZoom;
            this._targetZoom = spotlightZoom;
          } else {
            this.setPosition({ x: targetX, y: targetY });
            this.zoom = spotlightZoom;
          }
          this._activeGoalSpotlightKey = spotlightKey;
          return;
        }

        const spotlightVisualY = this.toVisualY(goalSpotlight.y);
        const scenePosition = {
          x: goalSpotlight.x,
          y: Math.max(-1.2, spotlightVisualY - 1.1),
        };
        if (shouldSnapToSpotlight) {
          this._position = { ...scenePosition };
          this._targetPosition = { ...scenePosition };
          this._zoom = spotlightZoom;
          this._targetZoom = spotlightZoom;
        } else {
          this.setPosition(scenePosition);
          this.zoom = spotlightZoom;
        }
        this._activeGoalSpotlightKey = spotlightKey;
        return;
      }

      this._activeGoalSpotlightKey = null;

      if (winnerSpotlight) {
        const zoomInProgress = Math.max(0, Math.min(1, (winnerSpotlightElapsed - 1820) / 620));
        const zoomOutProgress = Math.max(0, Math.min(1, (winnerSpotlightElapsed - 2940) / 840));
        const spotlightZoom = cruisingZoom + 0.82 + zoomInProgress * 1.08 - zoomOutProgress * 0.94;
        if (stage.presentation === 'side-scroll') {
          const laneFocus = 13 + (winnerSpotlight.position.x - 13) * 0.34;
          const targetX = Math.min(stage.goalY + 0.5, winnerSpotlight.position.y + 1.4);
          const targetY = stageLaneSpan - laneFocus;
          this.setPosition({ x: targetX, y: targetY });
          this.zoom = spotlightZoom;
          return;
        }

        const spotlightVisualY = this.toVisualY(winnerSpotlight.position.y);
        this.setPosition({
          x: winnerSpotlight.position.x,
          y: Math.max(-1.4, spotlightVisualY - 0.95),
        });
        this.zoom = spotlightZoom;
        return;
      }

      const chaseMarble = marbles[targetIndex + 1] ?? marbles[targetIndex - 1] ?? targetMarble;
      const thirdMarble = marbles[targetIndex + 2] ?? chaseMarble;
      const progress = Math.max(0, Math.min(1, targetMarble.position.y / stage.goalY));
      const finishBias = needToZoom ? Math.max(0, Math.min(1, (progress - 0.48) / 0.34)) : 0;
      const chaseGap = Math.abs(targetMarble.position.y - chaseMarble.position.y);
      const chaseBias = needToZoom ? Math.max(0, 0.18 - chaseGap * 0.03) : 0;
      const packTail = thirdMarble ?? chaseMarble;
      const packGap = Math.abs(targetMarble.position.y - packTail.position.y);
      const packTightness = needToZoom ? Math.max(0, Math.min(1, 1 - packGap / 15)) : 0;
      if (stage.presentation === 'side-scroll') {
        const laneBlendX =
          targetMarble.position.x * (0.58 - chaseBias * 0.18) +
          chaseMarble.position.x * (0.26 + chaseBias * 0.1) +
          thirdMarble.position.x * (0.16 + packTightness * 0.08);
        const laneFocus = 13 + (laneBlendX - 13) * (0.6 + packTightness * 0.1);
        const remainingDistance = Math.max(0, stage.goalY - targetMarble.position.y);
        const lookAhead = remainingDistance * (0.09 + finishBias * 0.14);
        const targetX = Math.min(stage.goalY - 1.4, targetMarble.position.y + lookAhead);
        const targetY = stageLaneSpan - laneFocus;

        this.setPosition({ x: targetX, y: targetY });
        if (needToZoom) {
          const goalDist = Math.abs(stage.zoomY - targetMarble.position.y);
          const finishRatio = Math.max(0, Math.min(1, 1 - goalDist / zoomThreshold));
          const packZoomBoost = packTightness * (0.18 + finishBias * 0.24);
          this.zoom = cruisingZoom + finishRatio * finishZoomBoost + packZoomBoost;
        } else {
          this.zoom = cruisingZoom;
        }
        return;
      }

      const leaderVisualY = this.toVisualY(targetMarble.position.y);
      const tailVisualY = this.toVisualY(packTail.position.y);
      const packSpan = Math.abs(tailVisualY - leaderVisualY);
      const targetX =
        targetMarble.position.x * (0.58 - chaseBias * 0.16) +
        chaseMarble.position.x * (0.27 + chaseBias * 0.08) +
        thirdMarble.position.x * (0.15 + packTightness * 0.08);
      const targetY = leaderVisualY * (1 - finishBias * 0.34) + Math.min(6.8, packSpan * (0.22 + packTightness * 0.2));

      this.setPosition({ x: targetX, y: targetY });
      if (needToZoom) {
        const goalDist = Math.abs(this.toVisualY(stage.zoomY) - leaderVisualY);
        const finishRatio = Math.max(0, Math.min(1, 1 - goalDist / zoomThreshold));
        const packZoomBoost = packTightness * (0.16 + finishBias * 0.22);
        this.zoom = cruisingZoom + finishRatio * finishZoomBoost + packZoomBoost;
      } else {
        this.zoom = cruisingZoom;
      }
    } else {
      this._activeGoalSpotlightKey = null;
      this.zoom = cruisingZoom;
    }
  }

  private _interpolation(current: number, target: number) {
    const d = target - current;
    if (Math.abs(d) < 1 / initialZoom) {
      return target;
    }

    return current + d / 10;
  }

  renderScene(
    ctx: CanvasRenderingContext2D,
    callback: (ctx: CanvasRenderingContext2D) => void,
    presentation: StageDef['presentation'] = 'default'
  ) {
    const zoomFactor = initialZoom * 2 * this._zoom;
    ctx.save();
    ctx.translate(-this.x * this._zoom, -this.y * this._zoom);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(ctx.canvas.width / zoomFactor, ctx.canvas.height / zoomFactor);
    if (presentation === 'side-scroll') {
      ctx.transform(0, -1, 1, 0, 0, stageLaneSpan);
    } else if (this._reverseFlow) {
      ctx.translate(0, this._goalY);
      ctx.scale(1, -1);
    }
    callback(ctx);
    ctx.restore();
  }
}
