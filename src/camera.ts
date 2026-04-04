import { initialZoom, zoomThreshold } from './data/constants';
import type { StageDef } from './data/maps';
import type { Marble } from './marble';
import type { VectorLike } from './types/VectorLike';

const cruisingZoom = 0.88;
const finishZoomBoost = 1.8;

export class Camera {
  private _position: VectorLike = { x: 0, y: 0 };
  private _targetPosition: VectorLike = { x: 0, y: 0 };
  private _zoom: number = 1;
  private _targetZoom: number = 1;
  private _locked = false;
  private _shouldFollowMarbles = false;
  private _goalY = 0;
  private _reverseFlow = true;

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

  setFlow(goalY: number, reverseFlow = true) {
    this._goalY = goalY;
    this._reverseFlow = reverseFlow;
  }

  toVisualY(y: number) {
    return this._reverseFlow ? this._goalY - y : y;
  }

  toWorldY(y: number) {
    return this._reverseFlow ? this._goalY - y : y;
  }

  startFollowingMarbles() {
    this._shouldFollowMarbles = true;
  }

  initializePosition(center?: VectorLike, zoom?: number) {
    const x = center?.x ?? 12.95;
    const y = this.toVisualY(center?.y ?? 2);
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
  }: {
    marbles: Marble[];
    stage: StageDef;
    needToZoom: boolean;
    targetIndex: number;
  }) {
    // set target position
    if (!this._locked) {
      this._calcTargetPositionAndZoom(marbles, stage, needToZoom, targetIndex);
    }

    // interpolate position
    this._position.x = this._interpolation(this.x, this._targetPosition.x);
    this._position.y = this._interpolation(this.y, this._targetPosition.y);

    // interpolate zoom
    this._zoom = this._interpolation(this._zoom, this._targetZoom);
  }

  private _calcTargetPositionAndZoom(marbles: Marble[], stage: StageDef, needToZoom: boolean, targetIndex: number) {
    if (!this._shouldFollowMarbles) {
      return;
    }

    if (marbles.length > 0) {
      const targetMarble = marbles[targetIndex] ? marbles[targetIndex] : marbles[0];
      const chaseMarble = marbles[targetIndex + 1] ?? marbles[targetIndex - 1] ?? targetMarble;
      const leaderVisualY = this.toVisualY(targetMarble.position.y);
      const progress = Math.max(0, Math.min(1, targetMarble.position.y / stage.goalY));
      const finishBias = needToZoom ? Math.max(0, Math.min(1, (progress - 0.58) / 0.42)) : 0;
      const chaseGap = Math.abs(targetMarble.position.y - chaseMarble.position.y);
      const chaseBias = needToZoom ? Math.max(0, 0.18 - chaseGap * 0.03) : 0;
      const targetX = targetMarble.position.x * (1 - chaseBias) + chaseMarble.position.x * chaseBias;
      const targetY = leaderVisualY * (1 - finishBias * 0.42);

      this.setPosition({ x: targetX, y: targetY });
      if (needToZoom) {
        const goalDist = Math.abs(this.toVisualY(stage.zoomY) - leaderVisualY);
        const finishRatio = Math.max(0, Math.min(1, 1 - goalDist / zoomThreshold));
        this.zoom = cruisingZoom + finishRatio * finishZoomBoost;
      } else {
        this.zoom = cruisingZoom;
      }
    } else {
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
    if (this._reverseFlow) {
      ctx.translate(0, this._goalY);
      ctx.scale(1, -1);
    }
    if (presentation === 'side-scroll') {
      ctx.rotate(Math.PI / 2);
    }
    callback(ctx);
    ctx.restore();
  }
}
