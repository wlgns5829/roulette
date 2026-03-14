import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';

const lifetime = 720;

export class SkillEffect implements GameObject {
  private _size: number = 0;
  position: VectorLike;
  private _elapsed: number = 0;
  isDestroy: boolean = false;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime;
    this._size = 0.6 + (this._elapsed / lifetime) * 13.5;
    if (this._elapsed > lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme) {
    ctx.save();
    const rate = this._elapsed / lifetime;
    const alpha = 1 - rate * rate;
    const lineWidth = 2.4 / zoom;

    ctx.globalAlpha = alpha * 0.32;
    ctx.fillStyle = theme.skillColor;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this._size * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = theme.skillColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this._size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.78;
    ctx.strokeStyle = theme.coolTimeIndicator;
    ctx.lineWidth = lineWidth * 0.8;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this._size * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.translate(this.position.x, this.position.y);
    ctx.strokeStyle = theme.skillColor;
    ctx.lineWidth = lineWidth * 0.85;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + rate * 0.45;
      const inner = this._size * 0.34;
      const outer = this._size * 1.14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }
}
