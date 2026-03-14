import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';

const lifetime = 1550;

export class SharkRushEffect implements GameObject {
  public isDestroy = false;
  private _elapsed = 0;
  private _startX: number;
  private _endX: number;
  private _y: number;
  private _direction: -1 | 1;
  private _accent: string;

  constructor(startX: number, endX: number, y: number, direction: -1 | 1, accent = '#60a5fa') {
    this._startX = startX;
    this._endX = endX;
    this._y = y;
    this._direction = direction;
    this._accent = accent;
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime;
    if (this._elapsed >= lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme) {
    const rate = Math.min(1, this._elapsed / lifetime);
    const eased = 1 - (1 - rate) ** 3;
    const x = this._startX + (this._endX - this._startX) * eased;
    const y = this._y + Math.sin(rate * Math.PI * 3.2) * 0.4;
    const alpha = Math.sin(Math.PI * Math.min(1, rate * 1.05));
    const bodyColor = this._accent;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this._direction, 1);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.09 / zoom;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 16 / zoom;
    ctx.shadowColor = this._accent;

    // Little fish companions
    for (let i = 0; i < 3; i++) {
      const fishX = -2.35 - i * 0.55;
      const fishY = -0.7 + i * 0.52 + Math.sin(rate * Math.PI * (2.4 + i * 0.3)) * 0.08;
      ctx.save();
      ctx.translate(fishX, fishY);
      ctx.scale(0.42 + i * 0.06, 0.42 + i * 0.06);
      ctx.globalAlpha = alpha * (0.55 - i * 0.1);

      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(191,219,254,0.95)';
      ctx.beginPath();
      ctx.moveTo(-0.55, 0);
      ctx.bezierCurveTo(-0.18, -0.28, 0.36, -0.2, 0.58, 0);
      ctx.bezierCurveTo(0.36, 0.22, -0.18, 0.28, -0.55, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(96,165,250,0.92)';
      ctx.beginPath();
      ctx.moveTo(-0.5, 0);
      ctx.lineTo(-0.9, -0.28);
      ctx.lineTo(-0.82, 0);
      ctx.lineTo(-0.9, 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0.28, -0.05, 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-1.4, 0);
    ctx.bezierCurveTo(-1.1, -0.8, 0.2, -0.95, 1.15, -0.25);
    ctx.bezierCurveTo(1.6, 0.05, 1.6, 0.4, 1.1, 0.66);
    ctx.bezierCurveTo(0.2, 1.05, -1.1, 0.86, -1.4, 0);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(-1.25, 0);
    ctx.lineTo(-2.02, -0.82);
    ctx.lineTo(-1.82, 0);
    ctx.lineTo(-2.02, 0.82);
    ctx.closePath();
    ctx.fill();

    // Belly
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(-0.15, 0.1);
    ctx.bezierCurveTo(0.35, -0.05, 0.82, 0.05, 1.05, 0.3);
    ctx.bezierCurveTo(0.7, 0.62, 0.15, 0.7, -0.2, 0.48);
    ctx.closePath();
    ctx.fill();

    // Fin
    ctx.fillStyle = '#bfdbfe';
    ctx.beginPath();
    ctx.moveTo(-0.18, -0.22);
    ctx.lineTo(0.25, -1.02);
    ctx.lineTo(0.72, -0.26);
    ctx.closePath();
    ctx.fill();

    // Side fin
    ctx.beginPath();
    ctx.moveTo(0.15, 0.2);
    ctx.lineTo(0.72, 0.56);
    ctx.lineTo(0.08, 0.58);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = theme.winnerText;
    ctx.beginPath();
    ctx.arc(0.82, -0.08, 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0.84, -0.08, 0.045, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0.7, 0.18, 0.16, 0.15, Math.PI * 0.95);
    ctx.stroke();

    // Blush
    ctx.fillStyle = 'rgba(251, 113, 133, 0.52)';
    ctx.beginPath();
    ctx.arc(0.52, 0.18, 0.09, 0, Math.PI * 2);
    ctx.arc(0.3, 0.2, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Splash trail
    ctx.strokeStyle = 'rgba(191, 219, 254, 0.95)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-1.95 - i * 0.28, -0.25 + i * 0.18, 0.08 + i * 0.05, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
