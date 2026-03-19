import type { Camera } from './camera';
import { getCuteMonsterPalette } from './cuteMonster';
import { canvasHeight, canvasWidth, initialZoom, Themes } from './data/constants';
import type { StageDef } from './data/maps';
import type { GameObject } from './gameObject';
import { KeywordService } from './keywordService';
import type { Marble } from './marble';
import { drawMarbleLook } from './marbleLooks';
import options from './options';
import type { ParticleManager } from './particleManager';
import type { ColorTheme } from './types/ColorTheme';
import type { MapEntityState } from './types/MapEntity.type';
import type { VectorLike } from './types/VectorLike';
import type { UIObject } from './UIObject';

export type RenderParameters = {
  camera: Camera;
  stage: StageDef;
  entities: MapEntityState[];
  marbles: Marble[];
  winners: Marble[];
  particleManager: ParticleManager;
  effects: GameObject[];
  winnerRank: number;
  winner: Marble | null;
  size: VectorLike;
  theme: ColorTheme;
};

export class RouletteRenderer {
  protected _canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  public sizeFactor = 1;

  protected _images: { [key: string]: HTMLImageElement } = {};
  protected _theme: ColorTheme = Themes.dark;
  protected _keywordService: KeywordService;

  constructor() {
    this._keywordService = this.createKeywordService();
  }

  protected createKeywordService(): KeywordService {
    return new KeywordService();
  }

  get width() {
    return this._canvas.width;
  }

  get height() {
    return this._canvas.height;
  }

  get canvas() {
    return this._canvas;
  }

  set theme(value: ColorTheme) {
    this._theme = value;
  }

  async init() {
    await Promise.all([this._load(), this._keywordService.init()]);

    this._canvas = document.createElement('canvas');
    this._canvas.width = canvasWidth;
    this._canvas.height = canvasHeight;
    this.ctx = this._canvas.getContext('2d', {
      alpha: false,
    }) as CanvasRenderingContext2D;

    document.body.appendChild(this._canvas);

    const resizing = (entries?: ResizeObserverEntry[]) => {
      const realSize = entries ? entries[0].contentRect : this._canvas.getBoundingClientRect();
      const width = Math.max(realSize.width / 2, 640);
      const height = (width / realSize.width) * realSize.height;
      this._canvas.width = width;
      this._canvas.height = height;
      this.sizeFactor = width / realSize.width;
    };

    const resizeObserver = new ResizeObserver(resizing);
    resizeObserver.observe(this._canvas);
    resizing();
  }

  private async _loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.src = url;
    });
  }

  private async _load(): Promise<void> {
    const imageDefs = [
      { name: 'Chamru', imgUrl: new URL('../assets/images/chamru.png', import.meta.url) },
      { name: 'Kubin', imgUrl: new URL('../assets/images/kubin.png', import.meta.url) },
      { name: 'Kkwak', imgUrl: new URL('../assets/images/kkwak.png', import.meta.url) },
      { name: 'Junyoop', imgUrl: new URL('../assets/images/junyoop.png', import.meta.url) },
      { name: 'Waldokun', imgUrl: new URL('../assets/images/waldokun.png', import.meta.url) },
    ];

    const loadPromises = imageDefs.map(({ name, imgUrl }) => {
      return (async () => {
        this._images[name] = await this._loadImage(imgUrl.toString());
      })();
    });

    loadPromises.push(
      (async () => {
        await this._loadImage(new URL('../assets/images/ff.svg', import.meta.url).toString());
      })()
    );

    await Promise.all(loadPromises);
  }

  private getMarbleImage(name: string): CanvasImageSource | undefined {
    if (this._images[name]) {
      return this._images[name];
    }
    return this._keywordService.getSprite(name);
  }

  protected onBeforeEntities(): void {}
  protected onAfterScene(): void {}

  private renderSummerBackdrop(stage: StageDef) {
    const { width, height } = this._canvas;
    const accent = stage.accent ?? '#22d3ee';
    const surfaceY = height * 0.14;
    const now = performance.now() * 0.001;

    const backdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, '#bff6ff');
    backdrop.addColorStop(0.12, '#88def2');
    backdrop.addColorStop(0.38, '#46a6c8');
    backdrop.addColorStop(0.7, '#1c6f97');
    backdrop.addColorStop(1, '#0f3554');
    this.ctx.fillStyle = backdrop;
    this.ctx.fillRect(0, 0, width, height);

    const surfaceGlow = this.ctx.createRadialGradient(
      width * 0.5,
      -height * 0.04,
      width * 0.02,
      width * 0.5,
      0,
      width * 0.42
    );
    surfaceGlow.addColorStop(0, 'rgba(255, 255, 245, 0.96)');
    surfaceGlow.addColorStop(0.28, 'rgba(216, 247, 255, 0.56)');
    surfaceGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = surfaceGlow;
    this.ctx.fillRect(0, 0, width, height * 0.46);

    const currentMist = this.ctx.createLinearGradient(0, surfaceY, 0, height);
    currentMist.addColorStop(0, 'rgba(244, 254, 255, 0.16)');
    currentMist.addColorStop(0.35, 'rgba(190, 245, 255, 0.08)');
    currentMist.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = currentMist;
    this.ctx.fillRect(0, surfaceY, width, height - surfaceY);

    this.drawWaveBand(surfaceY, height * 0.028, 'rgba(255, 255, 255, 0.16)', now * 0.95, true);
    this.drawWaveBand(surfaceY + height * 0.05, height * 0.024, 'rgba(210, 248, 255, 0.12)', now * 0.72 + 1.3, true);
    this.drawWaveBand(surfaceY + height * 0.1, height * 0.02, 'rgba(153, 226, 243, 0.08)', now * 0.55 + 2.2, true);

    for (let i = 0; i < 5; i++) {
      const x = width * (0.12 + i * 0.19) + Math.sin(now * 0.42 + i * 1.1) * width * 0.018;
      const ribbonWidth = width * (0.028 + (i % 2) * 0.008);
      const phase = now * (0.66 + i * 0.08) + i * 0.7;
      this.drawCurrentRibbon(x, ribbonWidth, phase, `rgba(214, 247, 255, ${0.03 + (i % 2) * 0.025})`);
    }

    for (let i = 0; i < 24; i++) {
      const travel = (now * (0.08 + (i % 4) * 0.018) + i * 0.11) % 1;
      const bubbleX = width * (0.08 + ((i * 0.17) % 0.84)) + Math.sin(now * 0.9 + i) * width * 0.008;
      const bubbleY = height + 36 - travel * (height + 72);
      const bubbleSize = Math.max(2.5, Math.min(width, height) * (0.004 + (i % 3) * 0.0016));
      this.ctx.save();
      this.ctx.globalAlpha = 0.15 + (1 - travel) * 0.28;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      this.ctx.strokeStyle = 'rgba(239, 253, 255, 0.7)';
      this.ctx.lineWidth = 1.1;
      this.ctx.beginPath();
      this.ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.drawSummerTube(width * 0.84, height * 0.12, Math.min(width, height) * 0.052, accent, now);
    this.drawIcedDrink(width * 0.16, height * 0.17, Math.min(width, height) * 0.074, now);
  }

  private drawWaveBand(y: number, amplitude: number, color: string, phase: number, fillFromTop = false) {
    const { width, height } = this._canvas;
    const segment = width / 6;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(0, fillFromTop ? 0 : height);
    this.ctx.lineTo(0, y);

    for (let i = 0; i <= 6; i++) {
      const startX = i * segment;
      const cp1X = startX + segment * 0.35;
      const cp2X = startX + segment * 0.68;
      const endX = startX + segment;
      const wave = Math.sin(phase + i * 0.82) * amplitude;
      const nextWave = Math.sin(phase + (i + 1) * 0.82) * amplitude;
      this.ctx.bezierCurveTo(cp1X, y + wave, cp2X, y - nextWave, endX, y + nextWave * 0.5);
    }

    this.ctx.lineTo(width, fillFromTop ? 0 : height);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawCurrentRibbon(x: number, width: number, phase: number, color: string) {
    const { height } = this._canvas;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x - width * 0.7, height + 40);

    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      const y = height + 40 - t * (height + 80);
      const sway = Math.sin(phase + t * 7.2) * width;
      const taper = 1 - t * 0.74;
      this.ctx.lineTo(x + sway - width * taper, y);
    }

    for (let i = 7; i >= 0; i--) {
      const t = i / 7;
      const y = height + 40 - t * (height + 80);
      const sway = Math.sin(phase + t * 7.2) * width;
      const taper = 1 - t * 0.74;
      this.ctx.lineTo(x + sway + width * taper, y);
    }

    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawSummerTube(x: number, y: number, radius: number, accent: string, time: number) {
    const bob = Math.sin(time * 1.1) * radius * 0.08;

    this.ctx.save();
    this.ctx.translate(x, y + bob);
    this.ctx.rotate(Math.sin(time * 0.8) * 0.08);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, radius * 0.95, radius * 0.82, radius * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff8ec';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.46, 0, Math.PI * 2);
    this.ctx.fillStyle = '#5db0d3';
    this.ctx.fill();

    this.ctx.lineWidth = radius * 0.24;
    this.ctx.strokeStyle = accent;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.76, -0.4, 0.95);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#fb7185';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.76, 1.2, 2.5);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawIcedDrink(x: number, y: number, size: number, time: number) {
    const sway = Math.sin(time * 0.7 + 0.8) * size * 0.04;

    this.ctx.save();
    this.ctx.translate(x, y + sway);
    this.ctx.rotate(Math.sin(time * 0.5) * 0.03);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.92, size * 0.62, size * 0.18, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(248, 254, 255, 0.82)';
    this.ctx.beginPath();
    this.ctx.roundRect(-size * 0.42, -size * 0.54, size * 0.84, size * 1.14, size * 0.14);
    this.ctx.fill();

    const drink = this.ctx.createLinearGradient(0, -size * 0.38, 0, size * 0.5);
    drink.addColorStop(0, '#7dd3fc');
    drink.addColorStop(0.52, '#38bdf8');
    drink.addColorStop(1, '#0ea5e9');
    this.ctx.fillStyle = drink;
    this.ctx.beginPath();
    this.ctx.roundRect(-size * 0.34, -size * 0.36, size * 0.68, size * 0.82, size * 0.12);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    this.ctx.beginPath();
    this.ctx.roundRect(-size * 0.22, -size * 0.26, size * 0.12, size * 0.62, size * 0.08);
    this.ctx.fill();

    this.ctx.strokeStyle = '#fef3c7';
    this.ctx.lineWidth = size * 0.08;
    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.02, -size * 0.64);
    this.ctx.lineTo(size * 0.32, -size * 1.02);
    this.ctx.stroke();

    this.ctx.fillStyle = '#fef3c7';
    this.ctx.beginPath();
    this.ctx.ellipse(size * 0.34, -size * 1.03, size * 0.08, size * 0.12, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  render(renderParameters: RenderParameters, uiObjects: UIObject[]) {
    this._theme = renderParameters.theme;
    this.renderSummerBackdrop(renderParameters.stage);

    this.ctx.save();
    this.ctx.scale(initialZoom, initialZoom);
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '0.4pt sans-serif';
    this.ctx.lineWidth = 3 / (renderParameters.camera.zoom + initialZoom);
    renderParameters.camera.renderScene(this.ctx, () => {
      this.onBeforeEntities();
      this.renderEntities(renderParameters.entities);
      this.renderEffects(renderParameters);
      this.renderMarbles(renderParameters);
    });
    this.ctx.restore();
    this.onAfterScene();

    uiObjects.forEach((obj) => obj.render(this.ctx, renderParameters, this._canvas.width, this._canvas.height));
    renderParameters.particleManager.render(this.ctx);
    this.renderWinner(renderParameters);
  }

  private renderEntities(entities: MapEntityState[]) {
    this.ctx.save();
    entities.forEach((entity) => {
      const transform = this.ctx.getTransform();
      this.ctx.translate(entity.x, entity.y);
      this.ctx.rotate(entity.angle);
      this.ctx.fillStyle = entity.shape.color ?? this._theme.entity[entity.shape.type].fill;
      this.ctx.strokeStyle = entity.shape.color ?? this._theme.entity[entity.shape.type].outline;
      this.ctx.shadowBlur = this._theme.entity[entity.shape.type].bloomRadius;
      this.ctx.shadowColor =
        entity.shape.bloomColor ?? entity.shape.color ?? this._theme.entity[entity.shape.type].bloom;

      switch (entity.shape.type) {
        case 'polyline':
          if (entity.shape.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(entity.shape.points[0][0], entity.shape.points[0][1]);
            for (let i = 1; i < entity.shape.points.length; i++) {
              this.ctx.lineTo(entity.shape.points[i][0], entity.shape.points[i][1]);
            }
            this.ctx.stroke();
          }
          break;
        case 'box': {
          const w = entity.shape.width * 2;
          const h = entity.shape.height * 2;
          this.ctx.rotate(entity.shape.rotation);
          this.ctx.fillRect(-w / 2, -h / 2, w, h);
          this.ctx.strokeRect(-w / 2, -h / 2, w, h);
          break;
        }
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, entity.shape.radius, 0, Math.PI * 2, false);
          this.ctx.stroke();
          break;
      }

      this.ctx.setTransform(transform);
    });
    this.ctx.restore();
  }

  private renderEffects({ effects, camera }: RenderParameters) {
    effects.forEach((effect) => effect.render(this.ctx, camera.zoom * initialZoom, this._theme));
  }

  private renderMarbles({ marbles, camera, winnerRank, winners, size }: RenderParameters) {
    const winnerIndex = winnerRank - winners.length;
    const viewPort = {
      x: camera.x,
      y: camera.toWorldY(camera.y),
      w: size.x,
      h: size.y,
      zoom: camera.zoom * initialZoom,
    };

    marbles.forEach((marble, i) => {
      marble.render(
        this.ctx,
        camera.zoom * initialZoom,
        i === winnerIndex,
        false,
        this.getMarbleImage(marble.name),
        viewPort,
        this._theme
      );
    });
  }

  private fitTextSize(text: string, maxWidth: number, maxSize: number, minSize: number, weight = 900) {
    let size = maxSize;
    while (size > minSize) {
      this.ctx.font = `${weight} ${size}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
      if (this.ctx.measureText(text).width <= maxWidth) {
        return size;
      }
      size -= 4;
    }

    return minSize;
  }

  private renderWinner({ winner, stage }: RenderParameters) {
    if (!winner) return;

    const palette = getCuteMonsterPalette(winner.id, winner.hue);
    const accent = stage.accent ?? palette.accent;
    const centerX = this._canvas.width / 2;
    const centerY = this._canvas.height * 0.48;
    const maxNameWidth = this._canvas.width * 0.82;
    const nameSize = this.fitTextSize(
      winner.name,
      maxNameWidth,
      Math.min(176, this._canvas.width * 0.17),
      Math.max(56, this._canvas.width * 0.075)
    );
    const labelSize = Math.max(26, Math.min(42, this._canvas.width * 0.034));
    const subSize = Math.max(20, Math.min(32, this._canvas.width * 0.025));
    const marbleImage = options.marbleStyle === 'sprite' ? this.getMarbleImage(winner.name) : undefined;
    const marbleSize = Math.max(96, Math.min(148, this._canvas.width * 0.105));
    const marbleCenterX = centerX;
    const marbleCenterY = centerY - nameSize * 0.95;

    this.ctx.save();

    const gradient = this.ctx.createRadialGradient(
      centerX,
      centerY - 60,
      24,
      centerX,
      centerY,
      this._canvas.width * 0.58
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.46)');
    gradient.addColorStop(0.28, 'rgba(255, 242, 204, 0.42)');
    gradient.addColorStop(0.58, 'rgba(251, 191, 36, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 248, 235, 0.1)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    this.ctx.globalAlpha = 0.22;
    this.ctx.fillStyle = accent;
    for (let i = 0; i < 7; i++) {
      const spread = this._canvas.width * (0.12 + i * 0.022);
      this.ctx.beginPath();
      this.ctx.arc(
        centerX + Math.cos(i * 0.8) * spread,
        centerY - nameSize * 0.78 + Math.sin(i * 1.1) * 46,
        22 + i * 8,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    this.ctx.save();
    this.ctx.translate(marbleCenterX, marbleCenterY);
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      this.ctx.rotate(angle);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.22 - i * 0.007})`;
      this.ctx.fillRect(56, -3.5, 48, 7);
      this.ctx.rotate(-angle);
    }
    this.ctx.restore();

    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
    this.ctx.arc(marbleCenterX, marbleCenterY, marbleSize * 0.76, 0, Math.PI * 2);
    this.ctx.fill();

    if (marbleImage) {
      this.ctx.drawImage(
        marbleImage,
        marbleCenterX - marbleSize / 2,
        marbleCenterY - marbleSize / 2,
        marbleSize,
        marbleSize
      );
    } else {
      drawMarbleLook(
        this.ctx,
        {
          x: marbleCenterX,
          y: marbleCenterY,
          size: marbleSize,
          hue: winner.hue,
          seed: winner.id,
          bounce: 0.35,
          glow: accent,
        },
        options.marbleStyle === 'sprite' ? 'retro' : options.marbleStyle
      );
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.lineJoin = 'round';

    this.ctx.font = `700 ${labelSize}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    this.ctx.fillStyle = '#6f451f';
    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.48)';
    this.ctx.fillText('오늘의 커피 당첨자', centerX, centerY - nameSize * 0.72);

    this.ctx.font = `700 ${nameSize}px 'Jua', 'Gowun Dodum', 'Malgun Gothic', sans-serif`;
    this.ctx.strokeStyle = 'rgba(93, 56, 26, 0.46)';
    this.ctx.lineWidth = 11;
    this.ctx.strokeText(winner.name, centerX, centerY);
    this.ctx.fillStyle = palette.detail;
    this.ctx.shadowBlur = 36;
    this.ctx.shadowColor = accent;
    this.ctx.fillText(winner.name, centerX, centerY);

    this.ctx.font = `600 ${subSize}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#77491d';
    this.ctx.fillText(`${stage.title} 통과`, centerX, centerY + nameSize * 0.6);
    this.ctx.fillStyle = accent;
    this.ctx.fillText('폭죽과 함께 오늘의 커피 요정 확정!', centerX, centerY + nameSize * 0.88);
    this.ctx.restore();
  }
}
