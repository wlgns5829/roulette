import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { EntityShape } from './types/MapEntity.type';

const lifetime = 680;

export class ObstacleBreakEffect implements GameObject {
  public isDestroy = false;
  private _elapsed = 0;

  constructor(
    private _x: number,
    private _y: number,
    private _shape: EntityShape,
    private _accent = '#fbbf24'
  ) {}

  update(deltaTime: number) {
    this._elapsed += deltaTime;
    if (this._elapsed >= lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme) {
    const rate = Math.min(1, this._elapsed / lifetime);
    const fade = 1 - rate;
    const burstRadius = this.getBurstRadius();
    const sparkleColor = theme.winnerText;

    ctx.save();
    ctx.translate(this._x, this._y);
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.globalAlpha = fade * 0.46;
    ctx.strokeStyle = this._accent;
    ctx.lineWidth = Math.max(0.025, 0.09 / zoom);
    ctx.shadowBlur = 18 / zoom;
    ctx.shadowColor = this._accent;
    ctx.beginPath();
    ctx.arc(0, 0, burstRadius * (0.45 + rate * 1.35), 0, Math.PI * 2);
    ctx.stroke();

    this.drawShapeEcho(ctx, zoom, fade);
    this.drawFragments(ctx, zoom, rate, fade, sparkleColor);

    ctx.restore();
  }

  private getBurstRadius() {
    switch (this._shape.type) {
      case 'box':
        return Math.max(0.72, Math.max(this._shape.width, this._shape.height) * 2.1);
      case 'circle':
        return Math.max(0.58, this._shape.radius * 2.35);
      default:
        return 1.05;
    }
  }

  private drawShapeEcho(ctx: CanvasRenderingContext2D, zoom: number, fade: number) {
    ctx.save();
    ctx.globalAlpha = fade * 0.2;
    ctx.strokeStyle = this._accent;
    ctx.lineWidth = Math.max(0.02, 0.06 / zoom);

    switch (this._shape.type) {
      case 'box': {
        const w = this._shape.width * 2.25;
        const h = this._shape.height * 2.25;
        ctx.rotate(this._shape.rotation);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      }
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this._shape.radius * 1.38, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'polyline':
        ctx.beginPath();
        ctx.moveTo(-0.56, -0.12);
        ctx.lineTo(0.08, 0.22);
        ctx.lineTo(0.62, -0.18);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }

  private drawFragments(ctx: CanvasRenderingContext2D, zoom: number, rate: number, fade: number, sparkleColor: string) {
    const count = this._shape.type === 'circle' ? 13 : this._shape.type === 'box' ? 11 : 9;
    const baseRadius = this.getBurstRadius();

    for (let i = 0; i < count; i++) {
      const seed = Math.sin((this._x + 17.13) * (i + 2.71) + (this._y + 3.97) * (i + 0.83));
      const angle = (Math.PI * 2 * i) / count + seed * 0.54;
      const distance = baseRadius * (0.25 + rate * (0.82 + Math.abs(seed) * 0.62));
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const shard = 0.08 + (Math.abs(seed) % 0.08);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + rate * 1.7);
      ctx.globalAlpha = fade * (0.48 + Math.abs(seed) * 0.28);
      ctx.fillStyle = i % 3 === 0 ? sparkleColor : this._accent;
      ctx.shadowBlur = i % 3 === 0 ? 12 / zoom : 8 / zoom;
      ctx.shadowColor = ctx.fillStyle as string;

      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(0, -shard * 1.7);
        ctx.lineTo(shard * 0.42, -shard * 0.22);
        ctx.lineTo(shard * 1.6, 0);
        ctx.lineTo(shard * 0.42, shard * 0.22);
        ctx.lineTo(0, shard * 1.7);
        ctx.lineTo(-shard * 0.42, shard * 0.22);
        ctx.lineTo(-shard * 1.6, 0);
        ctx.lineTo(-shard * 0.42, -shard * 0.22);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-shard * 0.5, -shard * 0.16, shard, shard * 0.32);
      }

      ctx.restore();
    }
  }
}
