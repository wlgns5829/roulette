import type { Marble } from './marble';
import type { RenderParameters } from './rouletteRenderer';
import type { Rect } from './types/rect.type';
import type { MouseEventArgs, UIObject } from './UIObject';
import { bound } from './utils/bound.decorator';

type RankRow = {
  marble: Marble;
  rank: number;
  isWinner: boolean;
  isLeader: boolean;
  isTarget: boolean;
};

export class RankRenderer implements UIObject {
  private _currentY = 0;
  private _targetY = 0;
  private fontHeight = 28;
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

    const tsv: string[] = [];
    let rank = 0;
    tsv.push(
      ...[...this.winners, ...this.marbles].map((marble) => {
        rank += 1;
        return [rank.toString(), marble.name, rank - 1 === this.winnerRank ? '*' : ''].join('\t');
      })
    );

    tsv.unshift(['Rank', 'Name', 'Winner'].join('\t'));

    navigator.clipboard.writeText(tsv.join('\n')).then(() => {
      if (this.messageHandler) {
        this.messageHandler('The result has been copied');
      }
    });
  }

  onMessage(func: (msg: string) => void) {
    this.messageHandler = func;
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
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
    const isLightTheme = theme.marbleWinningBorder === 'black';
    const panelWidth = Math.round(
      Math.max(isCompact ? 250 : 290, Math.min(isCompact ? width * 0.42 : width * 0.28, 360))
    );
    const panelX = width - panelWidth - (isCompact ? 16 : 22);
    const panelY = isCompact ? 72 : 18;
    const panelHeight = Math.round(Math.max(220, Math.min(height - panelY - 18, height * (isCompact ? 0.44 : 0.56))));
    const panelPadding = isCompact ? 14 : 18;
    const headerHeight = isCompact ? 52 : 58;
    const listHeight = panelHeight - headerHeight - panelPadding;

    this.fontHeight = isCompact ? 26 : 28;
    this.maxY = Math.max(0, winners.length * this.fontHeight + marbles.length * this.fontHeight - listHeight + this.fontHeight);
    this._currentWinner = winners.length;

    this.winners = winners;
    this.marbles = marbles;
    this.winnerRank = winnerRank;

    const startY = Math.max(0, Math.min(this._currentY, this.maxY));
    const rows: RankRow[] = [
      ...winners.map((marble, index) => ({
        marble,
        rank: index + 1,
        isWinner: true,
        isLeader: false,
        isTarget: index === winnerRank,
      })),
      ...marbles.map((marble, index) => ({
        marble,
        rank: winners.length + index + 1,
        isWinner: false,
        isLeader: index === 0,
        isTarget: winners.length + index === winnerRank,
      })),
    ];

    const panelFill = isLightTheme ? 'rgba(255, 249, 239, 0.82)' : 'rgba(11, 18, 29, 0.48)';
    const panelBorder = isLightTheme ? 'rgba(183, 136, 90, 0.28)' : 'rgba(255, 248, 235, 0.16)';
    const titleColor = isLightTheme ? '#6c3e1a' : '#fff7ea';
    const bodyColor = isLightTheme ? 'rgba(90, 57, 35, 0.84)' : 'rgba(255, 246, 235, 0.9)';
    const subColor = isLightTheme ? 'rgba(107, 74, 48, 0.76)' : 'rgba(255, 239, 223, 0.68)';

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    this.drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
    ctx.fillStyle = panelFill;
    ctx.fill();
    ctx.strokeStyle = panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `700 ${isCompact ? 15 : 16}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    ctx.fillStyle = subColor;
    ctx.fillText('LIVE RANK', panelX + panelPadding, panelY + 18);

    ctx.font = `700 ${isCompact ? 23 : 25}px 'Jua', 'Gowun Dodum', 'Malgun Gothic', sans-serif`;
    ctx.fillStyle = titleColor;
    ctx.fillText(`${winners.length} / ${rows.length}`, panelX + panelPadding, panelY + 42);

    ctx.font = `600 ${isCompact ? 12 : 13}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    ctx.fillStyle = subColor;
    ctx.textAlign = 'right';
    ctx.fillText('Scroll to browse', panelX + panelWidth - panelPadding, panelY + 42);

    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + panelPadding - 2, panelY + headerHeight, panelWidth - panelPadding * 2 + 4, listHeight);
    ctx.clip();
    ctx.translate(0, -startY);
    ctx.textAlign = 'left';

    rows.forEach((row, index) => {
      const rowTop = panelY + headerHeight + this.fontHeight * index;
      const visibleTop = startY + panelY + headerHeight;
      const visibleBottom = visibleTop + listHeight;
      if (rowTop + this.fontHeight < visibleTop || rowTop > visibleBottom) {
        return;
      }

      const y = rowTop + this.fontHeight / 2;
      const badgeText = row.isLeader ? 'LIVE' : row.isWinner ? 'GOAL' : row.isTarget ? 'PICK' : '';

      const rowFill = row.isLeader
        ? isLightTheme
          ? 'rgba(249, 115, 22, 0.12)'
          : 'rgba(251, 191, 36, 0.14)'
        : row.isWinner
          ? isLightTheme
            ? 'rgba(255, 214, 102, 0.12)'
            : 'rgba(255, 244, 214, 0.08)'
          : 'transparent';

      if (rowFill !== 'transparent') {
        this.drawRoundedRect(ctx, panelX + 8, rowTop + 2, panelWidth - 16, this.fontHeight - 4, 12);
        ctx.fillStyle = rowFill;
        ctx.fill();
      }

      const lightness = Math.min(92, theme.marbleLightness + (row.isLeader ? 10 : 0));
      ctx.fillStyle = row.isWinner ? subColor : `hsl(${row.marble.hue} 100% ${lightness}%)`;
      ctx.font = row.isLeader
        ? `700 ${isCompact ? 17 : 18}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`
        : `600 ${isCompact ? 15 : 16}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;

      const label = `${row.rank}. ${this.trimText(ctx, row.marble.name, panelWidth - panelPadding * 2 - 78)}`;
      ctx.fillText(label, panelX + panelPadding, y);

      if (badgeText) {
        ctx.font = `700 ${isCompact ? 11 : 12}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
        const badgeWidth = Math.max(46, ctx.measureText(badgeText).width + 18);
        const badgeHeight = isCompact ? 22 : 24;
        const badgeX = panelX + panelWidth - panelPadding - badgeWidth;

        this.drawRoundedRect(ctx, badgeX, y - badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2);
        ctx.fillStyle = row.isLeader
          ? '#f59e0b'
          : row.isWinner
            ? isLightTheme
              ? 'rgba(170, 123, 64, 0.16)'
              : 'rgba(255, 248, 235, 0.14)'
            : isLightTheme
              ? 'rgba(59, 130, 246, 0.16)'
              : 'rgba(96, 165, 250, 0.18)';
        ctx.fill();
        ctx.fillStyle = row.isLeader ? '#1f1308' : bodyColor;
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, y + 0.5);
        ctx.textAlign = 'left';
      }
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
      this._targetY = Math.max(0, this._currentWinner * this.fontHeight - this.fontHeight * 1.5);
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
