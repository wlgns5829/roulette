import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';

const lifetime = 1850;

export class FinishRankEffect implements GameObject {
  public isDestroy = false;
  public position: VectorLike;
  private _elapsed = 0;
  private _rank: number;
  private _name: string;
  private _accent: string;

  constructor(x: number, y: number, rank: number, name: string, accent: string) {
    this.position = { x, y };
    this._rank = rank;
    this._name = name;
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
    const alpha = 1 - rate;
    const lift = rate * 2.4;
    const pulse = 1 + Math.sin(rate * Math.PI * 10) * 0.06;
    const burstRadius = (1.8 + rate * 2.8) * pulse;
    const rankLabel = `${this._rank}등 통과`;

    ctx.save();
    ctx.translate(this.position.x, this.position.y + lift);
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 24 / zoom;
    ctx.shadowColor = this._accent;

    ctx.fillStyle = this._accent;
    ctx.beginPath();
    ctx.arc(0, 0, burstRadius * 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = (5.6 - rate * 3.2) / zoom;
    ctx.strokeStyle = this._accent;
    ctx.beginPath();
    ctx.arc(0, 0, burstRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = (3.2 - rate * 1.8) / zoom;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, burstRadius * 1.45, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      const angle = rate * Math.PI * 2 + (Math.PI * 2 * i) / 10;
      const inner = burstRadius * 0.32;
      const outer = burstRadius * (1.6 + (i % 2) * 0.14);
      ctx.beginPath();
      ctx.lineWidth = (2.6 - rate * 1.4) / zoom;
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(this.position.x, this.position.y + 3.35 + lift * 1.15);
    ctx.scale(1 / zoom, -1 / zoom);
    ctx.globalAlpha = 0.18 + alpha * 0.82;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    const rankFont = "800 10.5pt 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif";
    const nameFont = "800 13pt 'Jua', 'Gowun Dodum', 'Malgun Gothic', sans-serif";
    ctx.font = rankFont;
    const rankWidth = ctx.measureText(rankLabel).width;
    ctx.font = nameFont;
    const nameWidth = ctx.measureText(this._name).width;
    const cardWidth = Math.max(124, Math.max(rankWidth, nameWidth) + 34);
    const cardHeight = 48;

    ctx.fillStyle = 'rgba(15, 18, 28, 0.76)';
    ctx.strokeStyle = this._accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 12;
    ctx.shadowColor = this._accent;
    ctx.font = rankFont;
    ctx.fillStyle = this._accent;
    ctx.fillText(rankLabel, 0, -10);

    ctx.shadowBlur = 0;
    ctx.font = nameFont;
    ctx.strokeStyle = 'rgba(14, 22, 32, 0.92)';
    ctx.lineWidth = 4;
    ctx.strokeText(this._name, 0, 10);
    ctx.fillStyle = theme.winnerText;
    ctx.fillText(this._name, 0, 10);
    ctx.restore();
  }
}
