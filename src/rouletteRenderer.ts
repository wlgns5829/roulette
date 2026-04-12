import type { Camera } from './camera';
import { getCuteMonsterPalette } from './cuteMonster';
import { canvasHeight, canvasWidth, initialZoom, Themes } from './data/constants';
import type { StageDef } from './data/maps';
import { getStageBackdrop, stageBackdrops, type StageBackdropId, type StageBackdropPalette } from './data/stageBackdrops';
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
  podium: Marble[];
  size: VectorLike;
  theme: ColorTheme;
};

export class RouletteRenderer {
  protected _canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  public sizeFactor = 1;

  protected _images: { [key: string]: HTMLImageElement } = {};
  private _backdropImages: Partial<Record<StageBackdropId, HTMLImageElement>> = {};
  protected _theme: ColorTheme = Themes.dark;
  protected _keywordService: KeywordService;
  private _winnerRevealKey: string | null = null;
  private _winnerRevealStartedAt = 0;

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

    Object.values(stageBackdrops).forEach((backdrop) => {
      loadPromises.push(
        (async () => {
          this._backdropImages[backdrop.id] = await this._loadImage(backdrop.imageUrl);
        })()
      );
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

  private getSceneRotation(stage: StageDef) {
    return stage.presentation === 'side-scroll' ? -Math.PI / 2 : 0;
  }

  private renderBackdrop(stage: StageDef) {
    const backdropId = stage.backdrop ?? getStageBackdrop(0);
    const backdrop = stageBackdrops[backdropId];
    const backdropImage = this._backdropImages[backdropId];
    if (backdrop && backdropImage) {
      this.renderPhotoBackdrop(backdrop, stage.accent ?? '#f59e0b', backdropImage);
      return;
    }

    this.renderLagoonBackdrop(stage);
  }

  private drawBackdropCover(image: HTMLImageElement, focusX: number, focusY: number) {
    const { width, height } = this._canvas;
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const overflowX = Math.max(0, drawWidth - width);
    const overflowY = Math.max(0, drawHeight - height);
    const x = -overflowX * focusX;
    const y = -overflowY * focusY;

    this.ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }

  private renderPhotoBackdrop(backdrop: StageBackdropPalette, accent: string, image: HTMLImageElement) {
    const { width, height } = this._canvas;
    const now = performance.now() * 0.001;

    this.ctx.save();
    this.drawBackdropCover(image, backdrop.focusX, backdrop.focusY);

    const veil = this.ctx.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, backdrop.sceneTop);
    veil.addColorStop(0.48, backdrop.sceneMid);
    veil.addColorStop(1, backdrop.sceneBottom);
    this.ctx.fillStyle = veil;
    this.ctx.fillRect(0, 0, width, height);

    const leftGlow = this.ctx.createRadialGradient(width * 0.18, height * 0.22, width * 0.04, width * 0.18, height * 0.22, width * 0.4);
    leftGlow.addColorStop(0, backdrop.ambientOne);
    leftGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = leftGlow;
    this.ctx.fillRect(0, 0, width, height);

    const rightGlow = this.ctx.createRadialGradient(width * 0.82, height * 0.18, width * 0.04, width * 0.82, height * 0.18, width * 0.34);
    rightGlow.addColorStop(0, backdrop.ambientTwo);
    rightGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = rightGlow;
    this.ctx.fillRect(0, 0, width, height);

    const floorGlow = this.ctx.createRadialGradient(width * 0.5, height * 0.92, width * 0.05, width * 0.5, height * 0.92, width * 0.55);
    floorGlow.addColorStop(0, backdrop.ambientThree);
    floorGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = floorGlow;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.globalAlpha = 0.12;
    this.ctx.strokeStyle = accent;
    this.ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const y = height * (0.1 + i * 0.12);
      const drift = Math.sin(now * 0.55 + i * 0.9) * width * 0.01;
      this.ctx.beginPath();
      this.ctx.moveTo(-24, y);
      this.ctx.quadraticCurveTo(width * 0.34 + drift, y + 12, width * 0.68 - drift, y - 8);
      this.ctx.quadraticCurveTo(width * 0.86 + drift, y - 2, width + 24, y + 10);
      this.ctx.stroke();
    }
    this.ctx.restore();

    this.ctx.restore();
  }

  private renderLagoonBackdrop(stage: StageDef) {
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

  private renderSunsetBackdrop(stage: StageDef) {
    const { width, height } = this._canvas;
    const accent = stage.accent ?? '#fb7185';
    const now = performance.now() * 0.001;
    const horizonY = height * 0.48;

    const backdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, '#ffd8ab');
    backdrop.addColorStop(0.18, '#ffab74');
    backdrop.addColorStop(0.46, '#d66aa1');
    backdrop.addColorStop(0.74, '#5d2e6d');
    backdrop.addColorStop(1, '#26182e');
    this.ctx.fillStyle = backdrop;
    this.ctx.fillRect(0, 0, width, height);

    this.drawGlowOrb(width * 0.78, height * 0.22, Math.min(width, height) * 0.16, 'rgba(255, 245, 223, 0.96)', 'rgba(255, 193, 118, 0)');
    this.drawWaveBand(height * 0.16, height * 0.018, 'rgba(255, 244, 232, 0.14)', now * 0.2 + 0.4, true);
    this.drawWaveBand(height * 0.24, height * 0.022, 'rgba(255, 228, 219, 0.1)', now * 0.28 + 1.3, true);

    for (let i = 0; i < 18; i++) {
      const drift = (now * (0.035 + (i % 3) * 0.008) + i * 0.11) % 1;
      const x = width * (0.08 + ((i * 0.21) % 0.82)) + Math.sin(now * 0.5 + i) * width * 0.01;
      const y = height * 0.12 + drift * height * 0.3;
      const w = Math.max(9, width * (0.007 + (i % 3) * 0.002));
      const h = w * (0.42 + (i % 2) * 0.16);
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(Math.sin(now * 0.7 + i) * 0.35);
      this.ctx.fillStyle = i % 3 === 0 ? accent : i % 2 === 0 ? 'rgba(255, 237, 213, 0.78)' : 'rgba(255, 191, 157, 0.72)';
      this.ctx.fillRect(-w / 2, -h / 2, w, h);
      this.ctx.restore();
    }

    this.drawWaveBand(horizonY, height * 0.026, 'rgba(255, 255, 255, 0.07)', now * 0.52 + 0.5, true);
    this.drawWaveBand(horizonY + height * 0.06, height * 0.032, 'rgba(149, 72, 108, 0.44)', now * 0.68 + 1.1);
    this.drawWaveBand(horizonY + height * 0.14, height * 0.05, 'rgba(89, 39, 76, 0.7)', now * 0.84 + 2.2);
    this.drawWaveBand(horizonY + height * 0.24, height * 0.07, 'rgba(44, 24, 48, 0.95)', now * 0.98 + 3.1);

    for (let i = 0; i < 4; i++) {
      const lanternX = width * (0.16 + i * 0.22) + Math.sin(now * 0.45 + i) * width * 0.012;
      const lanternY = horizonY + height * (0.04 + (i % 2) * 0.05);
      this.ctx.save();
      this.ctx.translate(lanternX, lanternY);
      this.ctx.fillStyle = 'rgba(255, 235, 214, 0.14)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 16, 28, 9, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 222, 189, 0.85)' : 'rgba(255, 178, 132, 0.8)';
      this.ctx.beginPath();
      this.ctx.roundRect(-11, -16, 22, 24, 7);
      this.ctx.fill();
      this.ctx.strokeStyle = accent;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -16);
      this.ctx.lineTo(0, -34);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private renderMidnightBackdrop(stage: StageDef) {
    const { width, height } = this._canvas;
    const accent = stage.accent ?? '#22d3ee';
    const now = performance.now() * 0.001;
    const horizonY = height * 0.58;

    const backdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, '#09111f');
    backdrop.addColorStop(0.28, '#101b33');
    backdrop.addColorStop(0.65, '#120f27');
    backdrop.addColorStop(1, '#060912');
    this.ctx.fillStyle = backdrop;
    this.ctx.fillRect(0, 0, width, height);

    this.drawGlowOrb(width * 0.5, height * 0.18, Math.min(width, height) * 0.2, 'rgba(46, 214, 255, 0.16)', 'rgba(46, 214, 255, 0)');
    this.drawGlowOrb(width * 0.18, height * 0.16, Math.min(width, height) * 0.1, 'rgba(244, 114, 182, 0.12)', 'rgba(244, 114, 182, 0)');

    for (let i = 0; i < 42; i++) {
      const x = width * ((i * 0.137) % 1);
      const y = height * (0.06 + ((i * 0.097) % 0.42));
      const size = 1.1 + (i % 3) * 0.9;
      const pulse = 0.48 + 0.42 * Math.sin(now * (0.8 + (i % 5) * 0.12) + i);
      this.ctx.fillStyle = i % 4 === 0 ? `rgba(244, 114, 182, ${0.24 + pulse * 0.28})` : `rgba(216, 244, 255, ${0.2 + pulse * 0.24})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(72, 214, 255, 0.2)';
    this.ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      const ratio = i / 8;
      const y = horizonY + ratio * ratio * (height - horizonY);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) {
      const baseX = width * 0.5 + i * width * 0.08;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, height);
      this.ctx.lineTo(width * 0.5 + i * width * 0.018, horizonY);
      this.ctx.stroke();
    }
    this.ctx.restore();

    for (let i = 0; i < 5; i++) {
      const ringX = width * (0.14 + i * 0.19);
      const ringY = height * (0.22 + (i % 2) * 0.08);
      const radius = Math.min(width, height) * (0.03 + (i % 3) * 0.01);
      this.ctx.save();
      this.ctx.strokeStyle = i % 2 === 0 ? accent : 'rgba(244, 114, 182, 0.6)';
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = 0.35;
      this.ctx.beginPath();
      this.ctx.ellipse(ringX, ringY, radius * 1.3, radius, Math.sin(now * 0.4 + i) * 0.4, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.ctx.fillStyle = 'rgba(4, 10, 19, 0.92)';
    this.ctx.fillRect(0, horizonY, width, height - horizonY);
  }

  private renderGardenBackdrop(stage: StageDef) {
    const { width, height } = this._canvas;
    const accent = stage.accent ?? '#facc15';
    const now = performance.now() * 0.001;

    const backdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, '#e9ffd9');
    backdrop.addColorStop(0.2, '#b8f0be');
    backdrop.addColorStop(0.55, '#73c691');
    backdrop.addColorStop(1, '#214c36');
    this.ctx.fillStyle = backdrop;
    this.ctx.fillRect(0, 0, width, height);

    this.drawGlowOrb(width * 0.16, height * 0.16, Math.min(width, height) * 0.15, 'rgba(255, 251, 208, 0.92)', 'rgba(255, 251, 208, 0)');
    this.drawWaveBand(height * 0.18, height * 0.022, 'rgba(255, 255, 255, 0.16)', now * 0.22 + 0.8, true);
    this.drawWaveBand(height * 0.28, height * 0.026, 'rgba(236, 255, 236, 0.1)', now * 0.3 + 1.5, true);

    this.drawWaveBand(height * 0.62, height * 0.034, 'rgba(127, 213, 140, 0.5)', now * 0.48 + 0.5);
    this.drawWaveBand(height * 0.72, height * 0.05, 'rgba(88, 170, 100, 0.72)', now * 0.66 + 1.7);
    this.drawWaveBand(height * 0.82, height * 0.064, 'rgba(41, 104, 63, 0.94)', now * 0.82 + 2.8);

    for (let i = 0; i < 16; i++) {
      const travel = (now * (0.045 + (i % 4) * 0.01) + i * 0.09) % 1;
      const x = width * (0.06 + ((i * 0.19) % 0.88)) + Math.sin(now * 0.7 + i * 0.6) * width * 0.015;
      const y = -20 + travel * (height + 40);
      const size = Math.max(10, Math.min(width, height) * (0.012 + (i % 3) * 0.003));
      this.drawLeaf(x, y, size, Math.sin(now * 0.9 + i) * 0.8, i % 3 === 0 ? accent : i % 2 === 0 ? '#fef3c7' : '#86efac');
    }

    for (let i = 0; i < 6; i++) {
      const flowerX = width * (0.1 + i * 0.15);
      const flowerY = height * (0.86 + (i % 2) * 0.035);
      this.drawGlowOrb(flowerX, flowerY, Math.min(width, height) * 0.028, 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)');
    }
  }

  private drawGlowOrb(x: number, y: number, radius: number, coreColor: string, outerColor: string) {
    const glow = this.ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius);
    glow.addColorStop(0, coreColor);
    glow.addColorStop(1, outerColor);
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawLeaf(x: number, y: number, size: number, rotation: number, color: string) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.7);
    this.ctx.bezierCurveTo(size * 0.72, -size * 0.2, size * 0.62, size * 0.55, 0, size * 0.72);
    this.ctx.bezierCurveTo(-size * 0.62, size * 0.55, -size * 0.72, -size * 0.2, 0, -size * 0.7);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    this.ctx.lineWidth = Math.max(1.2, size * 0.08);
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.52);
    this.ctx.lineTo(0, size * 0.5);
    this.ctx.stroke();
    this.ctx.restore();
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
    this.renderBackdrop(renderParameters.stage);

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
      if (!renderParameters.winner) {
        this.renderMarbles(renderParameters);
      }
    }, renderParameters.stage.presentation);
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

  private renderMarbles({ marbles, camera, winnerRank, winners, size, stage }: RenderParameters) {
    const winnerIndex = winnerRank - winners.length;
    const leaderIndex = marbles.length > 0 ? 0 : -1;
    const sceneRotation = this.getSceneRotation(stage);
    const worldCenter = camera.getViewportCenter(stage);
    const isSideScroll = stage.presentation === 'side-scroll';
    const viewPort = {
      x: worldCenter.x,
      y: worldCenter.y,
      w: isSideScroll ? size.y : size.x,
      h: isSideScroll ? size.x : size.y,
      zoom: camera.zoom * initialZoom,
    };

    marbles.forEach((marble, i) => {
      marble.render(
        this.ctx,
        camera.zoom * initialZoom,
        i === winnerIndex || i === leaderIndex,
        false,
        this.getMarbleImage(marble.name),
        viewPort,
        this._theme,
        sceneRotation
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

  private clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  private easeOutCubic(value: number) {
    return 1 - (1 - value) ** 3;
  }

  private easeOutBack(value: number) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
  }

  private easeInOutCubic(value: number) {
    return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
  }

  private lerp(start: number, end: number, amount: number) {
    return start + (end - start) * amount;
  }

  private drawSpark(x: number, y: number, radius: number, color: string, alpha = 1) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = Math.max(1.4, radius * 0.18);
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(-radius, 0);
    this.ctx.lineTo(radius, 0);
    this.ctx.moveTo(0, -radius);
    this.ctx.lineTo(0, radius);
    this.ctx.moveTo(-radius * 0.58, -radius * 0.58);
    this.ctx.lineTo(radius * 0.58, radius * 0.58);
    this.ctx.moveTo(radius * 0.58, -radius * 0.58);
    this.ctx.lineTo(-radius * 0.58, radius * 0.58);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawCloudPuff(x: number, y: number, size: number, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    this.ctx.beginPath();
    this.ctx.arc(x - size * 0.42, y + size * 0.08, size * 0.3, 0, Math.PI * 2);
    this.ctx.arc(x, y - size * 0.06, size * 0.42, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.46, y + size * 0.1, size * 0.34, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.08, y + size * 0.2, size * 0.32, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawWinnerSmileFace(x: number, y: number, size: number, time: number, joy: number, accent: string) {
    const blink = 0.45 + Math.sin(time * 6.2) * 0.08;
    const cheekAlpha = 0.14 + joy * 0.22;
    const smileLift = Math.sin(time * 7.4) * size * 0.01;
    const mouthOpen = 0.46 + Math.sin(time * 5.8) * 0.06 + joy * 0.12;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.fillStyle = `rgba(255, 233, 214, ${cheekAlpha})`;
    this.ctx.beginPath();
    this.ctx.ellipse(-size * 0.19, size * 0.08, size * 0.1, size * 0.072, -0.18, 0, Math.PI * 2);
    this.ctx.ellipse(size * 0.19, size * 0.08, size * 0.1, size * 0.072, 0.18, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(63, 35, 22, 0.78)';
    this.ctx.lineWidth = Math.max(3, size * 0.035);
    this.ctx.beginPath();
    this.ctx.arc(-size * 0.17, -size * 0.03, size * 0.07, Math.PI * (0.14 + blink * 0.04), Math.PI * (0.88 - blink * 0.05));
    this.ctx.arc(size * 0.17, -size * 0.03, size * 0.07, Math.PI * (0.14 + blink * 0.04), Math.PI * (0.88 - blink * 0.05));
    this.ctx.stroke();

    this.ctx.save();
    this.ctx.translate(0, size * 0.12 + smileLift);
    this.ctx.strokeStyle = 'rgba(74, 38, 22, 0.86)';
    this.ctx.lineWidth = Math.max(3.4, size * 0.042);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * (0.15 + joy * 0.03), Math.PI * 0.12, Math.PI * 0.88);
    this.ctx.stroke();

    this.ctx.globalAlpha = 0.84;
    this.ctx.fillStyle = 'rgba(137, 41, 53, 0.88)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.01, size * 0.092, size * mouthOpen * 0.22, 0, 0, Math.PI);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(255, 247, 235, ${0.22 + joy * 0.22})`;
    this.ctx.beginPath();
    this.ctx.ellipse(0, -size * 0.01, size * 0.08, size * 0.03, 0, 0, Math.PI);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(255, 171, 194, ${0.38 + joy * 0.22})`;
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.04, size * 0.055, size * 0.032, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 + joy * 0.2})`;
    this.ctx.lineWidth = Math.max(1.8, size * 0.02);
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.08, -size * 0.18);
    this.ctx.lineTo(size * 0.08, -size * 0.23);
    this.ctx.stroke();

    this.ctx.shadowColor = accent;
    this.ctx.shadowBlur = size * 0.12;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.16 + joy * 0.12})`;
    this.ctx.beginPath();
    this.ctx.arc(-size * 0.1, -size * 0.16, size * 0.02, 0, Math.PI * 2);
    this.ctx.arc(size * 0.1, -size * 0.18, size * 0.018, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderPodiumBanner(podium: Marble[], accent: string, progress: number, width: number, height: number) {
    if (podium.length === 0 || progress <= 0) {
      return;
    }

    const eased = this.easeOutCubic(progress);
    const baseY = height * 0.79;

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.lineJoin = 'round';
    this.ctx.globalAlpha = 0.22 + eased * 0.78;
    this.ctx.font = `700 ${Math.max(18, Math.min(28, width * 0.02))}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    this.ctx.fillStyle = '#fff6dd';
    this.ctx.shadowBlur = 16;
    this.ctx.shadowColor = accent;
    this.ctx.fillText('결승 순위', width / 2, baseY - 46 + (1 - eased) * 12);

    podium.slice(0, 3).forEach((entry, index) => {
      const y = baseY + index * 34 + (1 - eased) * (18 + index * 4);
      const fillColor = index === 0 ? '#fde68a' : `hsl(${entry.hue} 100% ${index === 1 ? 88 : 84}%)`;
      const fontSize = index === 0 ? Math.max(24, Math.min(34, width * 0.026)) : Math.max(20, Math.min(28, width * 0.021));

      this.ctx.font = `${index === 0 ? 800 : 700} ${fontSize}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
      this.ctx.lineWidth = index === 0 ? 6 : 5;
      this.ctx.strokeStyle = 'rgba(24, 14, 8, 0.64)';
      this.ctx.fillStyle = fillColor;
      this.ctx.shadowBlur = index === 0 ? 18 : 12;
      this.ctx.shadowColor = index === 0 ? accent : 'rgba(255, 255, 255, 0.28)';
      this.ctx.strokeText(`${index + 1}등 ${entry.name}`, width / 2, y);
      this.ctx.fillText(`${index + 1}등 ${entry.name}`, width / 2, y);
    });

    this.ctx.restore();
  }

  private renderWinner({ winner, stage, podium }: RenderParameters) {
    if (!winner) {
      this._winnerRevealKey = null;
      this._winnerRevealStartedAt = 0;
      return;
    }

    const palette = getCuteMonsterPalette(winner.id, winner.hue);
    const accent = stage.accent ?? palette.accent;
    const revealKey = `${winner.id}:${winner.name}`;
    const now = performance.now();
    if (this._winnerRevealKey !== revealKey) {
      this._winnerRevealKey = revealKey;
      this._winnerRevealStartedAt = now;
    }

    const elapsed = now - this._winnerRevealStartedAt;
    const time = elapsed * 0.001;
    const oceanRiseProgress = this.clamp(elapsed / 1580);
    const landPauseProgress = this.clamp((elapsed - 1460) / 940);
    const skyLaunchProgress = this.clamp((elapsed - 2320) / 1480);
    const gatherProgress = this.clamp((elapsed - 2860) / 980);
    const coreBurstProgress = this.clamp((elapsed - 3440) / 640);
    const burstProgress = this.clamp((elapsed - 3880) / 1600);
    const zoomInProgress = this.clamp((elapsed - 2760) / 760);
    const zoomOutProgress = this.clamp((elapsed - 4040) / 980);
    const textProgress = this.clamp((elapsed - 4320) / 760);
    const podiumProgress = this.clamp((elapsed - 2480) / 620);
    const oceanRiseEase = this.easeOutBack(oceanRiseProgress);
    const landPauseEase = this.easeInOutCubic(landPauseProgress);
    const skyLaunchEase = this.easeInOutCubic(skyLaunchProgress);
    const seaToLandEase = this.easeInOutCubic(this.clamp((elapsed - 220) / 1880));
    const landToSkyEase = this.easeInOutCubic(this.clamp((elapsed - 1880) / 2240));
    const gatherEase = this.easeInOutCubic(gatherProgress);
    const coreBurstEase = this.easeOutCubic(coreBurstProgress);
    const burstEase = this.easeOutCubic(burstProgress);
    const joyEase = this.easeOutCubic(this.clamp((elapsed - 1740) / 2580));
    const focusScale = 1 + this.easeOutCubic(zoomInProgress) * 0.4 - this.easeInOutCubic(zoomOutProgress) * 0.24;
    const textEase = this.easeOutCubic(textProgress);
    const centerX = this._canvas.width / 2;
    const width = this._canvas.width;
    const height = this._canvas.height;
    const seaSurfaceY = height * 0.78;
    const islandY = height * 0.58;
    const cloudY = height * 0.23;
    const centerY = height * 0.48;
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
    const marbleVisualSize = marbleSize * focusScale;
    const marbleCenterX = centerX;
    const marbleDeepSeaY = height + marbleSize * 2.85;
    const marbleSurfaceY = seaSurfaceY - marbleSize * 0.96;
    const marbleLandY = islandY - marbleSize * 1.18;
    const marbleSkyY = height * 0.1;
    const oceanLegY = this.lerp(marbleDeepSeaY, marbleSurfaceY, oceanRiseEase);
    const shoreLegY = this.lerp(marbleSurfaceY, marbleLandY, landPauseEase);
    const landHoverY = shoreLegY - Math.sin(time * 5.2) * 4.4 * (0.5 + (1 - skyLaunchProgress) * 0.5);
    const skyLegY = this.lerp(marbleLandY, marbleSkyY, skyLaunchEase);
    const marbleCenterY =
      skyLaunchProgress > 0
        ? this.lerp(landHoverY, skyLegY, skyLaunchEase) - Math.sin(time * 8.4) * 12 * (1 - skyLaunchProgress)
        : landPauseProgress > 0
          ? this.lerp(oceanLegY, landHoverY, landPauseEase) - Math.sin(time * 7.6) * (4.4 + landPauseEase * 3.6)
          : oceanLegY - Math.sin(time * 7.4) * (5.6 + oceanRiseEase * 3.4);
    const islandAlpha = seaToLandEase * Math.max(0, 1 - skyLaunchProgress * 1.08);
    const nameY = centerY + nameSize * 0.14;
    const textOffsetY = (1 - textEase) * 42;
    const showText = textProgress > 0.01;

    this.ctx.save();

    const oceanBackdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    oceanBackdrop.addColorStop(0, '#08233d');
    oceanBackdrop.addColorStop(0.24, '#0d4263');
    oceanBackdrop.addColorStop(0.6, '#16719a');
    oceanBackdrop.addColorStop(1, '#0a2f4c');
    this.ctx.fillStyle = oceanBackdrop;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.globalAlpha = 0.2 + oceanRiseEase * 0.24;
    for (let i = 0; i < 7; i++) {
      const beamX = width * (0.1 + i * 0.14);
      const beamWidth = width * 0.045;
      const beamGradient = this.ctx.createLinearGradient(beamX, 0, beamX, height);
      beamGradient.addColorStop(0, 'rgba(201, 247, 255, 0.3)');
      beamGradient.addColorStop(0.55, 'rgba(123, 220, 241, 0.08)');
      beamGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = beamGradient;
      this.ctx.fillRect(beamX - beamWidth / 2, 0, beamWidth, height * 0.84);
    }
    this.ctx.restore();

    const landRevealY = height - seaToLandEase * (height * 0.96);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, landRevealY, width, height - landRevealY);
    this.ctx.clip();
    const landBackdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    landBackdrop.addColorStop(0, '#fde6b1');
    landBackdrop.addColorStop(0.24, '#ffc89f');
    landBackdrop.addColorStop(0.48, '#ffa97b');
    landBackdrop.addColorStop(0.72, '#5ec6df');
    landBackdrop.addColorStop(1, '#0f4f72');
    this.ctx.fillStyle = landBackdrop;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();

    const skyRevealHeight = height * (0.18 + landToSkyEase * 0.94);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, width, skyRevealHeight);
    this.ctx.clip();
    const skyBackdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    skyBackdrop.addColorStop(0, '#f6fdff');
    skyBackdrop.addColorStop(0.2, '#d9f7ff');
    skyBackdrop.addColorStop(0.46, '#97e8ff');
    skyBackdrop.addColorStop(0.78, '#7bcdf0');
    skyBackdrop.addColorStop(1, 'rgba(123, 205, 240, 0)');
    this.ctx.fillStyle = skyBackdrop;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();

    const landTransitionGlow = this.ctx.createLinearGradient(0, landRevealY - height * 0.08, 0, landRevealY + height * 0.08);
    landTransitionGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    landTransitionGlow.addColorStop(0.5, `rgba(255, 229, 181, ${0.12 + seaToLandEase * 0.22})`);
    landTransitionGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = landTransitionGlow;
    this.ctx.fillRect(0, landRevealY - height * 0.08, width, height * 0.16);

    const skyTransitionGlow = this.ctx.createLinearGradient(0, skyRevealHeight - height * 0.06, 0, skyRevealHeight + height * 0.08);
    skyTransitionGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    skyTransitionGlow.addColorStop(0.5, `rgba(226, 248, 255, ${0.08 + landToSkyEase * 0.24})`);
    skyTransitionGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = skyTransitionGlow;
    this.ctx.fillRect(0, skyRevealHeight - height * 0.06, width, height * 0.14);

    const sunGlow = this.ctx.createRadialGradient(centerX, height * 0.16, width * 0.02, centerX, height * 0.16, width * 0.22);
    sunGlow.addColorStop(0, 'rgba(255, 251, 229, 0.96)');
    sunGlow.addColorStop(0.28, 'rgba(255, 241, 199, 0.54)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.save();
    this.ctx.globalAlpha = 0.12 + seaToLandEase * 0.32 + landToSkyEase * 0.34;
    this.ctx.fillStyle = sunGlow;
    this.ctx.fillRect(0, 0, width, height * 0.46);
    this.ctx.restore();

    this.drawCloudPuff(width * 0.18, height * 0.17, width * 0.07, 0.16 + landToSkyEase * 0.52);
    this.drawCloudPuff(width * 0.79, height * 0.2, width * 0.09, 0.18 + landToSkyEase * 0.54);
    this.drawCloudPuff(width * 0.56, height * 0.12, width * 0.06, 0.12 + landToSkyEase * 0.46 + burstEase * 0.2);
    this.drawCloudPuff(width * 0.34, height * 0.26, width * 0.08, 0.1 + landToSkyEase * 0.42 + burstEase * 0.18);

    const oceanGradient = this.ctx.createLinearGradient(0, seaSurfaceY, 0, height);
    oceanGradient.addColorStop(0, 'rgba(67, 191, 233, 0.92)');
    oceanGradient.addColorStop(0.22, 'rgba(33, 137, 183, 0.96)');
    oceanGradient.addColorStop(1, 'rgba(7, 48, 79, 0.98)');
    this.ctx.fillStyle = oceanGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(0, seaSurfaceY);
    for (let i = 0; i <= 9; i++) {
      const x = (width / 9) * i;
      const waveY = seaSurfaceY + Math.sin(time * 2.2 + i * 0.7) * height * 0.008;
      this.ctx.lineTo(x, waveY);
    }
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.save();
    this.ctx.globalAlpha = 0.22;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 3.2;
    this.ctx.beginPath();
    for (let i = 0; i <= 9; i++) {
      const x = (width / 9) * i;
      const waveY = seaSurfaceY + Math.sin(time * 2.2 + i * 0.7) * height * 0.008;
      if (i === 0) {
        this.ctx.moveTo(x, waveY);
      } else {
        this.ctx.lineTo(x, waveY);
      }
    }
    this.ctx.stroke();
    this.ctx.restore();

    const seaSprayAlpha = (1 - skyLaunchProgress) * (0.12 + oceanRiseEase * 0.36) * (1 - coreBurstProgress * 0.45);
    for (let i = 0; i < 14; i++) {
      const sprayPhase = (oceanRiseEase * 1.12 + i / 14) % 1;
      const sprayX = centerX + Math.sin(time * 2.8 + i * 0.74) * marbleVisualSize * (0.42 + sprayPhase * 0.34);
      const sprayY = seaSurfaceY - sprayPhase * marbleVisualSize * 1.12;
      this.ctx.save();
      this.ctx.globalAlpha = seaSprayAlpha * (1 - sprayPhase * 0.55);
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.92)' : 'rgba(219, 244, 255, 0.9)';
      this.ctx.beginPath();
      this.ctx.arc(sprayX, sprayY, 2.4 + (i % 3) * 1.2 + sprayPhase * 1.6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.save();
    this.ctx.globalAlpha = 0.14 + islandAlpha * 0.24;
    this.ctx.strokeStyle = 'rgba(255, 250, 236, 0.96)';
    this.ctx.lineWidth = 4.2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - width * 0.13, islandY + marbleVisualSize * 0.28);
    this.ctx.quadraticCurveTo(centerX, islandY + marbleVisualSize * 0.19, centerX + width * 0.13, islandY + marbleVisualSize * 0.28);
    this.ctx.stroke();
    this.ctx.restore();

    const islandGlow = this.ctx.createRadialGradient(
      centerX,
      islandY + marbleVisualSize * 0.34,
      marbleVisualSize * 0.18,
      centerX,
      islandY + marbleVisualSize * 0.38,
      width * 0.24
    );
    islandGlow.addColorStop(0, `rgba(255, 243, 201, ${0.16 + islandAlpha * 0.16})`);
    islandGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = islandGlow;
    this.ctx.fillRect(0, islandY - marbleVisualSize, width, height - islandY + marbleVisualSize);

    this.ctx.save();
    this.ctx.globalAlpha = islandAlpha;
    this.ctx.fillStyle = '#6c5137';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, islandY + marbleVisualSize * 0.46, width * 0.16, marbleVisualSize * 0.46, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#9ac55a';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, islandY + marbleVisualSize * 0.22, width * 0.145, marbleVisualSize * 0.2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    const beamWidth = marbleVisualSize * (0.56 + landPauseEase * 0.14 + skyLaunchEase * 0.18);
    const beamGradient = this.ctx.createLinearGradient(0, marbleCenterY - marbleVisualSize * 0.6, 0, height);
    beamGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    beamGradient.addColorStop(0.24, `rgba(255, 255, 255, ${0.16 + landPauseEase * 0.18})`);
    beamGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = beamGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - beamWidth * 0.64, height);
    this.ctx.lineTo(centerX - beamWidth * 0.18, marbleCenterY + marbleVisualSize * 0.2);
    this.ctx.lineTo(centerX + beamWidth * 0.18, marbleCenterY + marbleVisualSize * 0.2);
    this.ctx.lineTo(centerX + beamWidth * 0.64, height);
    this.ctx.closePath();
    this.ctx.fill();

    const trailCount = 18;
    for (let i = 0; i < trailCount; i++) {
      const travel = (landPauseEase * 0.35 + skyLaunchEase * 0.95 + i / trailCount) % 1;
      const sparkX = centerX + Math.sin(time * 3.4 + i * 1.25) * beamWidth * (0.14 + travel * 0.18);
      const sparkY = height - travel * (height - marbleCenterY - marbleVisualSize * 0.1);
      const sparkSize = 2 + (1 - travel) * 4;
      this.ctx.save();
      this.ctx.globalAlpha = 0.18 + (1 - travel) * 0.3;
      this.ctx.fillStyle = i % 2 === 0 ? '#ffffff' : accent;
      this.ctx.beginPath();
      this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    for (let i = 0; i < 10; i++) {
      const bubbleProgress = (oceanRiseEase * 1.1 + i / 10) % 1;
      const bubbleX = centerX + Math.sin(time * 3 + i * 1.7) * marbleVisualSize * 0.42;
      const bubbleY = seaSurfaceY + marbleVisualSize * 0.7 + (1 - bubbleProgress) * (height - seaSurfaceY + marbleVisualSize * 0.9);
      this.ctx.save();
      this.ctx.globalAlpha = (1 - skyLaunchProgress) * (0.08 + bubbleProgress * 0.18);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      this.ctx.lineWidth = 1.4;
      this.ctx.beginPath();
      this.ctx.arc(bubbleX, bubbleY, 3 + bubbleProgress * 5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    if (gatherProgress > 0 && coreBurstProgress < 1) {
      const gatherAlpha = (1 - coreBurstProgress * 0.7) * (0.14 + gatherEase * 0.56);
      const chargeRadius = marbleVisualSize * (0.22 + gatherEase * 0.44);
      const chargeGlow = this.ctx.createRadialGradient(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * 0.08,
        marbleCenterX,
        marbleCenterY,
        chargeRadius * 2.4
      );
      chargeGlow.addColorStop(0, `rgba(255, 255, 255, ${0.18 + gatherEase * 0.24})`);
      chargeGlow.addColorStop(0.28, `rgba(255, 245, 196, ${0.16 + gatherEase * 0.24})`);
      chargeGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = chargeGlow;
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY, chargeRadius * 2.4, 0, Math.PI * 2);
      this.ctx.fill();

      for (let i = 0; i < 24; i++) {
        const angle = time * (1.6 + (i % 3) * 0.22) + i * 0.52;
        const outerRadius = marbleVisualSize * (1.8 + (i % 4) * 0.16);
        const innerRadius = marbleVisualSize * (0.32 + (i % 3) * 0.07);
        const pullRadius = this.lerp(outerRadius, innerRadius, gatherEase);
        const sway = Math.sin(time * 4.6 + i * 0.8) * marbleVisualSize * 0.06 * (1 - gatherEase);
        const px = marbleCenterX + Math.cos(angle) * pullRadius;
        const py = marbleCenterY + Math.sin(angle) * pullRadius * 0.62 + sway;
        const sparkRadius = 4 + (i % 3) * 1.6 + gatherEase * 3;
        this.drawSpark(px, py, sparkRadius, i % 2 === 0 ? '#ffffff' : accent, gatherAlpha);

        if (gatherEase > 0.2) {
          this.ctx.save();
          this.ctx.globalAlpha = gatherAlpha * 0.22;
          this.ctx.strokeStyle = i % 2 === 0 ? '#fff7d6' : accent;
          this.ctx.lineWidth = 1.4 + (i % 2) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(
            marbleCenterX + (px - marbleCenterX) * 0.26,
            marbleCenterY + (py - marbleCenterY) * 0.26
          );
          this.ctx.stroke();
          this.ctx.restore();
        }
      }

      this.ctx.save();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 + gatherEase * 0.3})`;
      this.ctx.lineWidth = 3.4;
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY, chargeRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    if (coreBurstProgress > 0) {
      const coreRadius = marbleVisualSize * (0.24 + coreBurstEase * 0.5);
      const coreOuterRadius = marbleVisualSize * (0.46 + coreBurstEase * 0.98);
      const coreGlow = this.ctx.createRadialGradient(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * 0.08,
        marbleCenterX,
        marbleCenterY,
        coreOuterRadius
      );
      coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.5 + coreBurstEase * 0.34})`);
      coreGlow.addColorStop(0.24, `rgba(255, 247, 220, ${0.34 + coreBurstEase * 0.24})`);
      coreGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = coreGlow;
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY, coreOuterRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.save();
      this.ctx.translate(marbleCenterX, marbleCenterY);
      this.ctx.rotate(coreBurstEase * 0.35);
      this.ctx.lineCap = 'round';
      for (let ray = 0; ray < 30; ray++) {
        const angle = (Math.PI * 2 * ray) / 30;
        const innerRadius = marbleVisualSize * (0.08 + (ray % 3) * 0.02);
        const outerRadius = coreOuterRadius * (0.72 + (ray % 4) * 0.08);
        this.ctx.save();
        this.ctx.rotate(angle);
        this.ctx.strokeStyle = ray % 2 === 0 ? '#ffffff' : accent;
        this.ctx.globalAlpha = 0.24 + coreBurstEase * 0.52 - (ray % 5) * 0.018;
        this.ctx.lineWidth = 3.1 + (ray % 3) * 0.65;
        this.ctx.beginPath();
        this.ctx.moveTo(innerRadius, 0);
        this.ctx.lineTo(outerRadius, 0);
        this.ctx.stroke();
        this.ctx.restore();
      }
      this.ctx.restore();

      this.ctx.save();
      this.ctx.globalAlpha = (1 - coreBurstProgress) * 0.18;
      this.ctx.fillStyle = '#fffdf5';
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.26 + coreBurstEase * 0.38})`;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY, coreRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY, coreOuterRadius * (0.92 + coreBurstEase * 0.24), 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    const burstAnchors = [
      { x: centerX, y: cloudY },
      { x: centerX, y: height * 0.18 },
      { x: width * 0.24, y: height * 0.27 },
      { x: width * 0.76, y: height * 0.25 },
      { x: width * 0.4, y: height * 0.14 },
      { x: width * 0.62, y: height * 0.12 },
      { x: width * 0.14, y: height * 0.2 },
      { x: width * 0.86, y: height * 0.18 },
      { x: centerX, y: height * 0.16 },
    ];

    for (let i = 0; i < burstAnchors.length; i++) {
      const localBurst = this.clamp((elapsed - 3880 - i * 165) / 1120);
      if (localBurst <= 0) continue;
      const burstAlpha = (1 - localBurst) * (0.48 + burstEase * 0.36);
      const burstX = burstAnchors[i].x;
      const burstY = burstAnchors[i].y;
      const burstRadius = width * (0.042 + (i % 4) * 0.01) * (0.6 + localBurst * 1.34);

      this.ctx.save();
      this.ctx.translate(burstX, burstY);
      this.ctx.rotate(i * 0.34 + localBurst * 0.55);
      this.ctx.strokeStyle = i % 2 === 0 ? accent : '#fff7d6';
      this.ctx.lineWidth = 3.8;
      this.ctx.globalAlpha = burstAlpha;
      for (let ray = 0; ray < 20; ray++) {
        const angle = (Math.PI * 2 * ray) / 20;
        this.ctx.beginPath();
        this.ctx.moveTo(Math.cos(angle) * burstRadius * 0.18, Math.sin(angle) * burstRadius * 0.18);
        this.ctx.lineTo(Math.cos(angle) * burstRadius, Math.sin(angle) * burstRadius);
        this.ctx.stroke();
      }
      this.ctx.globalAlpha = burstAlpha * 0.42;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, burstRadius * 0.72, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      for (let spark = 0; spark < 7; spark++) {
        const sparkAngle = (Math.PI * 2 * spark) / 7 + i * 0.38;
        this.drawSpark(
          burstX + Math.cos(sparkAngle) * burstRadius * 0.84,
          burstY + Math.sin(sparkAngle) * burstRadius * 0.84,
          6 + localBurst * 8,
          spark % 2 === 0 ? '#ffffff' : accent,
          burstAlpha * 0.95
        );
      }
    }

    this.ctx.save();
    this.ctx.translate(marbleCenterX, marbleCenterY);
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + burstEase * 0.16;
      this.ctx.rotate(angle);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + burstEase * 0.08 - i * 0.006})`;
      this.ctx.fillRect(64, -3.5, 62, 7);
      this.ctx.rotate(-angle);
    }
    this.ctx.restore();

    this.ctx.beginPath();
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.24 + landPauseEase * 0.14 + burstEase * 0.12})`;
    this.ctx.arc(marbleCenterX, marbleCenterY, marbleVisualSize * (0.72 + burstEase * 0.12), 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = `rgba(255, 247, 220, ${0.14 + burstEase * 0.16})`;
    this.ctx.arc(marbleCenterX, marbleCenterY, marbleVisualSize * (1.02 + Math.sin(time * 6.4) * 0.04), 0, Math.PI * 2);
    this.ctx.fill();

    if (skyLaunchProgress > 0.08) {
      for (let i = 0; i < 10; i++) {
        const trailProgress = (skyLaunchEase * 1.08 + i / 10) % 1;
        const trailY = marbleCenterY + marbleVisualSize * (0.24 + trailProgress * 1.42);
        const trailX = marbleCenterX + Math.sin(time * 4.1 + i * 0.92) * marbleVisualSize * (0.14 + trailProgress * 0.08);
        this.drawCloudPuff(
          trailX,
          trailY,
          marbleVisualSize * (0.16 + (1 - trailProgress) * 0.18),
          (1 - trailProgress) * 0.16 * skyLaunchProgress
        );
      }
    }

    this.ctx.save();
    this.ctx.translate(marbleCenterX, marbleCenterY);
    if (marbleImage) {
        this.ctx.drawImage(
          marbleImage,
          -marbleVisualSize / 2,
          -marbleVisualSize / 2,
          marbleVisualSize,
          marbleVisualSize
        );
    } else {
      drawMarbleLook(
        this.ctx,
        {
          x: 0,
          y: 0,
          size: marbleVisualSize,
          hue: winner.hue,
          seed: winner.id,
          bounce: 0.42,
          glow: accent,
        },
        options.marbleStyle === 'sprite' ? 'retro' : options.marbleStyle
      );
    }
    this.ctx.restore();
    this.drawWinnerSmileFace(marbleCenterX, marbleCenterY, marbleVisualSize, time, joyEase, accent);
    this.renderPodiumBanner(podium, accent, podiumProgress, width, height);

    for (let i = 0; i < 8; i++) {
      const orbitAngle = elapsed * 0.0038 + i * ((Math.PI * 2) / 8);
      const orbitRadius = marbleVisualSize * (1.06 + (i % 3) * 0.15 + burstEase * 0.08);
      this.drawSpark(
        marbleCenterX + Math.cos(orbitAngle) * orbitRadius,
        marbleCenterY + Math.sin(orbitAngle) * orbitRadius * 0.62,
        4 + (i % 3) * 3 + burstEase * 3,
        i % 2 === 0 ? '#ffffff' : accent,
        0.2 + burstEase * 0.5
      );
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.lineJoin = 'round';

    if (showText) {
      this.ctx.globalAlpha = 0.16 + textEase * 0.84;
      this.ctx.font = `700 ${labelSize}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
      this.ctx.fillStyle = '#6f451f';
      this.ctx.shadowBlur = 18;
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillText('오늘의 당첨자', centerX, nameY - nameSize * 0.82 + textOffsetY);

      this.ctx.font = `700 ${nameSize}px 'Jua', 'Gowun Dodum', 'Malgun Gothic', sans-serif`;
      this.ctx.strokeStyle = 'rgba(93, 56, 26, 0.46)';
      this.ctx.lineWidth = 11;
      this.ctx.strokeText(winner.name, centerX, nameY + textOffsetY * 0.28);
      this.ctx.fillStyle = palette.detail;
      this.ctx.shadowBlur = 36;
      this.ctx.shadowColor = accent;
      this.ctx.fillText(winner.name, centerX, nameY + textOffsetY * 0.28);

      this.ctx.font = `600 ${subSize}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#77491d';
      this.ctx.fillText(`${stage.title} 돌파`, centerX, nameY + nameSize * 0.64 + textOffsetY * 0.18);
      this.ctx.fillStyle = accent;
      this.ctx.fillText('바다를 뚫고 지상을 지나 구름 하늘에서 승리 폭발!', centerX, nameY + nameSize * 0.94 + textOffsetY * 0.16);
    }
    this.ctx.restore();
  }
}
