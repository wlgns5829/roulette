import type { Marble } from './marble';
import type { RenderParameters } from './rouletteRenderer';
import type { Rect } from './types/rect.type';
import type { MouseEventArgs, UIObject } from './UIObject';
import { bound } from './utils/bound.decorator';

type RankRow = {
  marble: Marble;
  rank: number;
  isLeader: boolean;
  isWinner: boolean;
  isTarget: boolean;
};

export class RankRenderer implements UIObject {
  private _currentY = 0;
  private _targetY = 0;
  private fontHeight = 21;
  private _userMoved = 0;
  private _currentWinner = -1;
  private maxY = 0;
  private winners: Marble[] = [];
  private marbles: Marble[] = [];
  private winnerRank = -1;
  private messageHandler?: (msg: string) => void;

  @bound
  onWheel(e: WheelEvent) {
    this._targetY += e.deltaY;
    this._targetY = Math.max(0, Math.min(this._targetY, this.maxY));
    this._userMoved = 2000;
  }

  @bound
  onDblClick(e?: MouseEventArgs) {
    if (!e || !navigator.clipboard) {
      return;
    }

    const rows = [...this.winners, ...this.marbles];
    const tsv = rows.map((marble, index) => [String(index + 1), marble.name, index === this.winnerRank ? '*' : ''].join('\t'));
    tsv.unshift(['Rank', 'Name', 'Winner'].join('\t'));

    navigator.clipboard.writeText(tsv.join('\n')).then(() => {
      this.messageHandler?.('The result has been copied');
    });
  }

  onMessage(func: (msg: string) => void) {
    this.messageHandler = func;
  }

  private trimText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let shortened = text;
    while (shortened.length > 0 && ctx.measureText(`${shortened}...`).width > maxWidth) {
      shortened = shortened.slice(0, -1);
    }

    return shortened.length > 0 ? `${shortened}...` : text;
  }

  render(
    ctx: CanvasRenderingContext2D,
    { winners, marbles, winnerRank, theme }: RenderParameters,
    width: number,
    height: number
  ) {
    const isCompact = width <= 980;
    const baseX = width - (isCompact ? 14 : 18);
    const baseY = isCompact ? 78 : 22;
    const columnWidth = isCompact ? 220 : 250;
    const listHeight = Math.min(height * (isCompact ? 0.34 : 0.42), isCompact ? 240 : 320);

    this.fontHeight = isCompact ? 19 : 21;
    this.maxY = Math.max(0, (winners.length + marbles.length) * this.fontHeight - listHeight + this.fontHeight);
    this._currentWinner = winners.length;
    this.winners = winners;
    this.marbles = marbles;
    this.winnerRank = winnerRank;

    const startY = Math.max(0, Math.min(this._currentY, this.maxY));
    const rows: RankRow[] = [
      ...winners.map((marble, index) => ({
        marble,
        rank: index + 1,
        isLeader: false,
        isWinner: true,
        isTarget: index === winnerRank,
      })),
      ...marbles.map((marble, index) => ({
        marble,
        rank: winners.length + index + 1,
        isLeader: index === 0,
        isWinner: false,
        isTarget: winners.length + index === winnerRank,
      })),
    ];

    const shadowColor = 'rgba(23, 16, 10, 0.62)';
    const countColor = 'rgba(255, 247, 237, 0.9)';
    const subColor = 'rgba(255, 236, 214, 0.7)';

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;

    ctx.font = `700 ${isCompact ? 15 : 16}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = shadowColor;
    ctx.fillStyle = countColor;
    ctx.strokeText(`${winners.length} / ${rows.length}`, baseX, baseY);
    ctx.fillText(`${winners.length} / ${rows.length}`, baseX, baseY);

    ctx.font = `600 ${isCompact ? 11 : 12}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = shadowColor;
    ctx.fillStyle = subColor;
    ctx.strokeText('LIVE RANK', baseX, baseY + 17);
    ctx.fillText('LIVE RANK', baseX, baseY + 17);

    ctx.save();
    ctx.beginPath();
    ctx.rect(baseX - columnWidth, baseY + 28, columnWidth + 8, listHeight);
    ctx.clip();
    ctx.translate(0, -startY);

    rows.forEach((row, index) => {
      const y = baseY + 45 + index * this.fontHeight;
      const top = y - this.fontHeight / 2;
      const visibleTop = baseY + 28 + startY;
      const visibleBottom = visibleTop + listHeight;
      if (top + this.fontHeight < visibleTop || top > visibleBottom) {
        return;
      }

      const labelPrefix = row.isLeader ? '1st' : row.isWinner ? 'GOAL' : `${row.rank}`;
      const fontSize = row.isLeader ? (isCompact ? 17 : 18) : isCompact ? 15 : 16;
      const text = `${labelPrefix}. ${this.trimText(ctx, row.marble.name, columnWidth - 40)}`;

      ctx.font = `${row.isLeader ? 700 : 600} ${fontSize}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
      ctx.lineWidth = row.isLeader ? 4.5 : 3.5;
      ctx.strokeStyle = shadowColor;
      ctx.fillStyle = row.isLeader
        ? '#fde68a'
        : row.isWinner
          ? 'rgba(255, 241, 214, 0.82)'
          : row.isTarget
            ? '#93c5fd'
            : `hsl(${row.marble.hue} 100% ${Math.min(90, theme.marbleLightness + 6)}%)`;
      ctx.strokeText(text, baseX, y);
      ctx.fillText(text, baseX, y);
    });

    ctx.restore();
    ctx.restore();
  }

  update(deltaTime: number) {
    if (this._currentWinner === -1) {
      return;
    }

    if (this._userMoved > 0) {
      this._userMoved -= deltaTime;
    } else {
      this._targetY = Math.max(0, this._currentWinner * this.fontHeight - this.fontHeight * 1.6);
    }

    this._targetY = Math.max(0, Math.min(this._targetY, this.maxY));

    if (this._currentY !== this._targetY) {
      this._currentY += (this._targetY - this._currentY) * (deltaTime / 250);
    }

    if (Math.abs(this._currentY - this._targetY) < 1) {
      this._currentY = this._targetY;
    }
  }

  getBoundingBox(): Rect | null {
    return null;
  }
}
