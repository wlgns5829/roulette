import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';

const lifetime = 2600;

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
    const baseRadius = 1 + rate * 6.4;
    const lift = rate * 4.6;

    ctx.save();
    ctx.translate(this.position.x, this.position.y - lift);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this._accent;
    ctx.fillStyle = this._accent;
    ctx.shadowBlur = 28 / zoom;
    ctx.shadowColor = this._accent;

    const beam = ctx.createLinearGradient(0, baseRadius * 0.2, 0, 8.2 + rate * 2.8);
    beam.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    beam.addColorStop(0.4, 'rgba(255, 255, 255, 0.22)');
    beam.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 0.26 * alpha;
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-1.6, 7.8 + rate * 2.6);
    ctx.lineTo(-0.5, 0.5);
    ctx.lineTo(0.5, 0.5);
    ctx.lineTo(1.6, 7.8 + rate * 2.6);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = alpha;
    for (let i = 0; i < 16; i++) {
      const angle = rate * Math.PI * 1.8 + (Math.PI * 2 * i) / 16;
      const inner = 0.9 + rate * 1.5;
      const outer = 2.8 + rate * 4.1;
      ctx.beginPath();
      ctx.lineWidth = (3.1 - rate * 2.1) / zoom;
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.48 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.74 * alpha;
    ctx.lineWidth = (6.5 - rate * 4.3) / zoom;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.46 * alpha;
    ctx.lineWidth = (3.6 - rate * 2.4) / zoom;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 2.05, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.35 * alpha;
    ctx.strokeStyle = theme.winnerText;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 2.38, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = rate * Math.PI * 2.6 + (Math.PI * 2 * i) / 6;
      const sparkleRadius = baseRadius * (1.7 + (i % 2) * 0.28);
      const x = Math.cos(angle) * sparkleRadius;
      const y = Math.sin(angle) * sparkleRadius;
      const sparkleSize = 0.32 + (1 - rate) * 0.4;
      ctx.globalAlpha = 0.85 * alpha;
      ctx.strokeStyle = i % 2 === 0 ? theme.winnerText : '#ffffff';
      ctx.lineWidth = 1.2 / zoom;
      ctx.beginPath();
      ctx.moveTo(x - sparkleSize, y);
      ctx.lineTo(x + sparkleSize, y);
      ctx.moveTo(x, y - sparkleSize);
      ctx.lineTo(x, y + sparkleSize);
      ctx.stroke();
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = theme.winnerText;
    ctx.beginPath();
    ctx.arc(0, 0, 0.58 + Math.sin(rate * Math.PI * 10) * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
