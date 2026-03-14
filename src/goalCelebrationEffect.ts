import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';

const lifetime = 2200;

export class GoalCelebrationEffect implements GameObject {
  public isDestroy = false;
  private _elapsed = 0;
  public position: VectorLike;
  private _accent: string;

  constructor(x: number, y: number, accent = '#f59e0b') {
    this.position = { x, y };
    this._accent = accent;
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime;
    if (this._elapsed >= lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme) {
    const rate = this._elapsed / lifetime;
    const alpha = 1 - rate;
    const baseRadius = 0.9 + rate * 5.4;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this._accent;
    ctx.fillStyle = this._accent;
    ctx.shadowBlur = 24 / zoom;
    ctx.shadowColor = this._accent;

    for (let i = 0; i < 12; i++) {
      const angle = rate * Math.PI * 2 + (Math.PI * 2 * i) / 12;
      const inner = 1 + rate * 1.4;
      const outer = 2.6 + rate * 3.4;
      ctx.beginPath();
      ctx.lineWidth = (3 - rate * 2) / zoom;
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.42 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.65 * alpha;
    ctx.lineWidth = (6 - rate * 4) / zoom;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.35 * alpha;
    ctx.strokeStyle = theme.winnerText;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = theme.winnerText;
    ctx.beginPath();
    ctx.arc(0, 0, 0.55 + Math.sin(rate * Math.PI * 8) * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
