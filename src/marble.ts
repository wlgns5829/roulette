import { getCuteMonsterPalette } from './cuteMonster';
import { Skills, STUCK_DELAY, Themes } from './data/constants';
import type { IPhysics } from './IPhysics';
import { drawMarbleLook } from './marbleLooks';
import options from './options';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';
import { transformGuard } from './utils/transformGuard';
import { rad } from './utils/utils';
import { Vector } from './utils/Vector';

export class Marble {
  type = 'marble' as const;
  name: string = '';
  size: number = 0.5;
  color: string = 'red';
  hue: number = 0;
  impact: number = 0;
  weight: number = 1;
  skill: Skills = Skills.None;
  isActive: boolean = false;

  private _coolTime = 5000;
  private _maxCoolTime = 5000;
  private _stuckTime = 0;
  private lastPosition: VectorLike = { x: 0, y: 0 };
  private theme: ColorTheme = Themes.dark;

  private physics: IPhysics;

  id: number;

  get position() {
    return this.physics.getMarblePosition(this.id) || { x: 0, y: 0, angle: 0 };
  }

  get x() {
    return this.position.x;
  }

  set x(v: number) {
    this.position.x = v;
  }

  get y() {
    return this.position.y;
  }

  set y(v: number) {
    this.position.y = v;
  }

  get angle() {
    return this.position.angle;
  }

  constructor(physics: IPhysics, order: number, max: number, name?: string, weight: number = 1) {
    this.name = name || `M${order}`;
    this.weight = weight;
    this.physics = physics;

    this._setNextCoolTime(true);

    const maxLine = Math.ceil(max / 10);
    const line = Math.floor(order / 10);
    const lineDelta = -Math.max(0, Math.ceil(maxLine - 5));
    this.hue = (360 / max) * order;
    this.color = getCuteMonsterPalette(order, this.hue).label;
    this.id = order;

    physics.createMarble(order, 10.25 + (order % 10) * 0.6, maxLine - line + lineDelta);
  }

  update(deltaTime: number) {
    if (this.isActive && Vector.lenSq(Vector.sub(this.lastPosition, this.position)) < 0.00001) {
      this._stuckTime += deltaTime;

      if (this._stuckTime > STUCK_DELAY) {
        this.physics.shakeMarble(this.id);
        this._stuckTime = 0;
      }
    } else {
      this._stuckTime = 0;
    }
    this.lastPosition = { x: this.position.x, y: this.position.y };

    this.skill = Skills.None;
    if (this.impact) {
      this.impact = Math.max(0, this.impact - deltaTime);
    }
    if (!this.isActive) return;
    if (options.useSkills) {
      this._updateSkillInformation(deltaTime);
    }
  }

  private _updateSkillInformation(deltaTime: number) {
    if (this._coolTime > 0) {
      this._coolTime = Math.max(0, this._coolTime - deltaTime);
    }

    if (this._coolTime <= 0) {
      this.skill = Skills.Impact;
      this._setNextCoolTime();
    }
  }

  private _setNextCoolTime(initial: boolean = false) {
    const weightedBase = 4800 + (1 - this.weight) * 1800;
    const weightedVariance = 2200 + (1 - this.weight) * 2200;
    this._maxCoolTime = weightedBase + Math.random() * weightedVariance;
    this._coolTime = initial ? this._maxCoolTime * (0.35 + Math.random() * 0.4) : this._maxCoolTime;
  }

  private _getVisualScale() {
    if (typeof window === 'undefined') {
      return 1;
    }

    if (window.innerWidth <= 980) {
      return 1.18;
    }

    return 1;
  }

  render(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    outline: boolean,
    isMinimap: boolean = false,
    skin: CanvasImageSource | undefined,
    viewPort: { x: number; y: number; w: number; h: number; zoom: number },
    theme: ColorTheme,
    sceneRotation = 0
  ) {
    this.theme = theme;
    const viewPortHw = viewPort.w / viewPort.zoom / 2;
    const viewPortHh = viewPort.h / viewPort.zoom / 2;
    const viewPortLeft = viewPort.x - viewPortHw;
    const viewPortRight = viewPort.x + viewPortHw;
    const viewPortTop = viewPort.y - viewPortHh - this.size / 2;
    const viewPortBottom = viewPort.y + viewPortHh;
    if (
      !isMinimap &&
      (this.x < viewPortLeft || this.x > viewPortRight || this.y < viewPortTop || this.y > viewPortBottom)
    ) {
      return;
    }
    const transform = ctx.getTransform();
    if (isMinimap) {
      this._renderMinimap(ctx);
    } else {
      this._renderNormal(ctx, zoom, outline, skin, sceneRotation);
    }
    ctx.setTransform(transform);
  }

  private _renderMinimap(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    this._drawMarbleBody(ctx, true);
  }

  private _drawMarbleBody(ctx: CanvasRenderingContext2D, isMinimap: boolean) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, isMinimap ? this.size : this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private _renderNormal(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    outline: boolean,
    skin?: CanvasImageSource,
    sceneRotation = 0
  ) {
    const hs = this.size / 2;
    const impactRatio = Math.min(1, this.impact / 500);
    const style = options.marbleStyle;
    const visualScale = this._getVisualScale();
    const isCharacterStyle = style === 'boss';

    if (!isCharacterStyle) {
      transformGuard(ctx, () => {
        ctx.translate(this.x, this.y);
        ctx.scale(1, -1);
        ctx.strokeStyle = 'rgba(12, 18, 28, 0.72)';
        ctx.lineWidth = Math.max(0.06, this.size * 0.15);
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.78 * visualScale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 250, 244, 0.52)';
        ctx.lineWidth = Math.max(0.03, this.size * 0.06);
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.72 * visualScale, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    if (style === 'sprite' && skin) {
      transformGuard(ctx, () => {
        ctx.translate(this.x, this.y);
        ctx.scale(1, -1);
        ctx.rotate(this.angle);
        ctx.drawImage(skin, -hs * visualScale, -hs * visualScale, hs * 2 * visualScale, hs * 2 * visualScale);
      });
    } else {
      drawMarbleLook(
        ctx,
        {
          x: this.x,
          y: this.y,
          size: this.size * 1.4 * visualScale,
          hue: this.hue,
          seed: this.id,
          rotation: this.angle,
          bounce: impactRatio,
          glow: this.theme.marbleWinningBorder,
          flipY: true,
        },
        style === 'sprite' ? 'retro' : style
      );
    }

    ctx.shadowColor = '';
    ctx.shadowBlur = 0;
    this._drawName(ctx, zoom, sceneRotation);

    if (outline && !isCharacterStyle) {
      this._drawOutline(ctx, 2 / zoom);
    }

    if (options.useSkills && !isCharacterStyle) {
      this._renderCoolTime(ctx, zoom);
    }
  }

  private _drawName(ctx: CanvasRenderingContext2D, zoom: number, sceneRotation = 0) {
    const labelColor =
      this.theme.marbleWinningBorder === 'white' ? 'rgba(255, 248, 239, 0.96)' : 'rgba(45, 28, 18, 0.94)';
    const strokeColor =
      this.theme.marbleWinningBorder === 'white' ? 'rgba(17, 24, 39, 0.82)' : 'rgba(255, 251, 244, 0.92)';

    transformGuard(ctx, () => {
      ctx.font = `700 11pt 'Jua', 'Gowun Dodum', 'Malgun Gothic', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3.4;
      ctx.shadowBlur = 0;
      ctx.translate(this.x, this.y - 0.92 * this._getVisualScale());
      if (sceneRotation) {
        ctx.rotate(-sceneRotation);
      }
      ctx.scale(1 / zoom, -1 / zoom);
      ctx.fillStyle = labelColor;
      ctx.strokeText(this.name, 0, 0);
      ctx.fillText(this.name, 0, 0);
    });
  }

  private _drawOutline(ctx: CanvasRenderingContext2D, lineWidth: number) {
    const visualRadius = this.size * 0.66 * this._getVisualScale();
    ctx.beginPath();
    ctx.strokeStyle = this.theme.marbleWinningBorder;
    ctx.lineWidth = lineWidth;
    ctx.arc(this.x, this.y, visualRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  private _renderCoolTime(ctx: CanvasRenderingContext2D, zoom: number) {
    const visualRadius = this.size * 0.66 * this._getVisualScale();
    ctx.strokeStyle = this.theme.coolTimeIndicator;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.arc(this.x, this.y, visualRadius + 2 / zoom, rad(270), rad(270 + (360 * this._coolTime) / this._maxCoolTime));
    ctx.stroke();
  }
}
