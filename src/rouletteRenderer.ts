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
  podium: Marble[];
  goalSpotlight: {
    rank: number;
    name: string;
    revealName: boolean;
    accent: string;
    elapsed: number;
    duration: number;
  } | null;
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
      img.addEventListener('error', () => resolve(img));
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

  private getSceneRotation(stage: StageDef) {
    return stage.presentation === 'side-scroll' ? -Math.PI / 2 : 0;
  }

  private renderBackdrop(stage: StageDef) {
    this.renderCinematicStageBackdrop(stage);
  }

  private renderSolidStageBackdrop() {
    this.ctx.fillStyle = '#101827';
    this.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }

  private renderCinematicStageBackdrop(stage: StageDef) {
    const { width, height } = this._canvas;
    const now = performance.now() * 0.001;
    const accent = stage.accent ?? '#f59e0b';
    const backdrop = stage.backdrop ?? 'sakura-village';
    const palettes: Record<
      string,
      { top: string; mid: string; bottom: string; glowA: string; glowB: string; mood: string }
    > = {
      'sakura-village': {
        top: '#183152',
        mid: '#16375a',
        bottom: '#0b2038',
        glowA: 'rgba(255, 187, 220, 0.2)',
        glowB: 'rgba(141, 236, 172, 0.16)',
        mood: 'meadow',
      },
      'sky-sanctum': {
        top: '#15345a',
        mid: '#17466d',
        bottom: '#0a2541',
        glowA: 'rgba(147, 213, 255, 0.22)',
        glowB: 'rgba(255, 255, 255, 0.14)',
        mood: 'lake',
      },
      'mushroom-square': {
        top: '#241f45',
        mid: '#1e3154',
        bottom: '#0b1d35',
        glowA: 'rgba(255, 159, 100, 0.22)',
        glowB: 'rgba(255, 229, 149, 0.16)',
        mood: 'sunset',
      },
      'abyss-corridor': {
        top: '#0e2747',
        mid: '#0f3d64',
        bottom: '#071d35',
        glowA: 'rgba(68, 226, 255, 0.18)',
        glowB: 'rgba(88, 118, 255, 0.14)',
        mood: 'abyss',
      },
      'aurora-village': {
        top: '#142846',
        mid: '#1c355b',
        bottom: '#0b203a',
        glowA: 'rgba(144, 180, 255, 0.2)',
        glowB: 'rgba(125, 255, 204, 0.14)',
        mood: 'aurora',
      },
      'moon-market': {
        top: '#102743',
        mid: '#183758',
        bottom: '#0b1d33',
        glowA: 'rgba(255, 191, 112, 0.2)',
        glowB: 'rgba(100, 196, 255, 0.14)',
        mood: 'city',
      },
      'star-palace': {
        top: '#132d55',
        mid: '#164269',
        bottom: '#09213c',
        glowA: 'rgba(113, 235, 255, 0.22)',
        glowB: 'rgba(255, 239, 173, 0.12)',
        mood: 'spire',
      },
      'harvest-terrace': {
        top: '#17304d',
        mid: '#1b3a55',
        bottom: '#0a2038',
        glowA: 'rgba(184, 255, 136, 0.16)',
        glowB: 'rgba(255, 224, 135, 0.14)',
        mood: 'garden',
      },
    };
    const palette = palettes[backdrop] ?? palettes['sakura-village'];

    const base = this.ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, palette.top);
    base.addColorStop(0.48, palette.mid);
    base.addColorStop(1, palette.bottom);
    this.ctx.fillStyle = base;
    this.ctx.fillRect(0, 0, width, height);

    this.drawGlowOrb(width * 0.22, height * 0.2, width * 0.32, palette.glowA, 'rgba(0, 0, 0, 0)');
    this.drawGlowOrb(width * 0.82, height * 0.28, width * 0.28, palette.glowB, 'rgba(0, 0, 0, 0)');

    switch (palette.mood) {
      case 'lake':
        this.drawBackdropRidges(height * 0.43, 'rgba(221, 245, 255, 0.16)', 'rgba(4, 11, 21, 0.34)', 0.56, now);
        this.drawBackdropWater(height * 0.58, 'rgba(160, 226, 255, 0.11)', now);
        break;
      case 'sunset':
        this.drawBackdropSun(width * 0.76, height * 0.22, width * 0.1, 'rgba(255, 222, 150, 0.38)');
        this.drawBackdropRidges(height * 0.52, 'rgba(255, 180, 112, 0.18)', 'rgba(17, 8, 16, 0.48)', 0.72, now);
        break;
      case 'abyss':
        this.drawBackdropWater(height * 0.2, 'rgba(107, 235, 255, 0.09)', now);
        this.drawBackdropParticles(42, accent, 0.16, now);
        break;
      case 'aurora':
        this.drawAuroraRibbons(now, accent);
        this.drawBackdropRidges(height * 0.62, 'rgba(210, 230, 255, 0.16)', 'rgba(7, 9, 17, 0.45)', 0.62, now);
        break;
      case 'city':
        this.drawBackdropSkyline(height * 0.6, accent, now);
        break;
      case 'spire':
        this.drawBackdropSpire(width * 0.74, height * 0.52, height * 0.44, accent);
        this.drawBackdropParticles(36, '#ffffff', 0.13, now);
        break;
      case 'garden':
        this.drawBackdropRidges(height * 0.7, 'rgba(181, 255, 146, 0.14)', 'rgba(4, 13, 7, 0.48)', 0.48, now);
        this.drawBackdropLeaves(now, accent);
        break;
      case 'meadow':
      default:
        this.drawBackdropRidges(height * 0.68, 'rgba(195, 255, 168, 0.13)', 'rgba(5, 13, 8, 0.46)', 0.5, now);
        this.drawBackdropPetals(now, accent);
        break;
    }

    this.drawReadableRaceLane(stage, accent);
    this.drawBackdropParticles(26, '#ffffff', 0.08, now + 1.7);

    const vignette = this.ctx.createRadialGradient(
      width * 0.5,
      height * 0.52,
      width * 0.08,
      width * 0.5,
      height * 0.52,
      width * 0.74
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.52, 'rgba(8, 27, 50, 0.08)');
    vignette.addColorStop(1, 'rgba(5, 22, 43, 0.5)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, width, height);
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

    this.drawGlowOrb(
      width * 0.78,
      height * 0.22,
      Math.min(width, height) * 0.16,
      'rgba(255, 245, 223, 0.96)',
      'rgba(255, 193, 118, 0)'
    );
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
      this.ctx.fillStyle =
        i % 3 === 0 ? accent : i % 2 === 0 ? 'rgba(255, 237, 213, 0.78)' : 'rgba(255, 191, 157, 0.72)';
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

    this.drawGlowOrb(
      width * 0.5,
      height * 0.18,
      Math.min(width, height) * 0.2,
      'rgba(46, 214, 255, 0.16)',
      'rgba(46, 214, 255, 0)'
    );
    this.drawGlowOrb(
      width * 0.18,
      height * 0.16,
      Math.min(width, height) * 0.1,
      'rgba(244, 114, 182, 0.12)',
      'rgba(244, 114, 182, 0)'
    );

    for (let i = 0; i < 42; i++) {
      const x = width * ((i * 0.137) % 1);
      const y = height * (0.06 + ((i * 0.097) % 0.42));
      const size = 1.1 + (i % 3) * 0.9;
      const pulse = 0.48 + 0.42 * Math.sin(now * (0.8 + (i % 5) * 0.12) + i);
      this.ctx.fillStyle =
        i % 4 === 0 ? `rgba(244, 114, 182, ${0.24 + pulse * 0.28})` : `rgba(216, 244, 255, ${0.2 + pulse * 0.24})`;
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

    this.drawGlowOrb(
      width * 0.16,
      height * 0.16,
      Math.min(width, height) * 0.15,
      'rgba(255, 251, 208, 0.92)',
      'rgba(255, 251, 208, 0)'
    );
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
      this.drawLeaf(
        x,
        y,
        size,
        Math.sin(now * 0.9 + i) * 0.8,
        i % 3 === 0 ? accent : i % 2 === 0 ? '#fef3c7' : '#86efac'
      );
    }

    for (let i = 0; i < 6; i++) {
      const flowerX = width * (0.1 + i * 0.15);
      const flowerY = height * (0.86 + (i % 2) * 0.035);
      this.drawGlowOrb(
        flowerX,
        flowerY,
        Math.min(width, height) * 0.028,
        'rgba(255, 255, 255, 0.2)',
        'rgba(255, 255, 255, 0)'
      );
    }
  }

  private drawReadableRaceLane(stage: StageDef, accent: string) {
    const { width, height } = this._canvas;
    const centerX = width * 0.5;
    const laneWidth = width * 0.5;
    const pulse = 0.5 + Math.sin(performance.now() * 0.0014 + stage.goalY * 0.01) * 0.5;

    const lane = this.ctx.createLinearGradient(centerX - laneWidth / 2, 0, centerX + laneWidth / 2, 0);
    lane.addColorStop(0, 'rgba(10, 27, 48, 0)');
    lane.addColorStop(0.18, 'rgba(10, 31, 56, 0.2)');
    lane.addColorStop(0.5, 'rgba(12, 38, 68, 0.34)');
    lane.addColorStop(0.82, 'rgba(10, 31, 56, 0.2)');
    lane.addColorStop(1, 'rgba(10, 27, 48, 0)');
    this.ctx.fillStyle = lane;
    this.ctx.fillRect(centerX - laneWidth / 2, 0, laneWidth, height);

    const stageLight = this.ctx.createRadialGradient(
      centerX,
      height * 0.42,
      width * 0.08,
      centerX,
      height * 0.42,
      width * 0.34
    );
    stageLight.addColorStop(0, `rgba(255, 255, 255, ${0.08 + pulse * 0.03})`);
    stageLight.addColorStop(0.34, `rgba(255, 255, 255, ${0.035 + pulse * 0.02})`);
    stageLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = stageLight;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.globalAlpha = 0.28;
    this.ctx.strokeStyle = accent;
    this.ctx.lineWidth = Math.max(1.4, width * 0.002);
    this.ctx.setLineDash([8, 18]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - laneWidth * 0.42, height * 0.04);
    this.ctx.lineTo(centerX - laneWidth * 0.28, height * 0.96);
    this.ctx.moveTo(centerX + laneWidth * 0.42, height * 0.04);
    this.ctx.lineTo(centerX + laneWidth * 0.28, height * 0.96);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawBackdropRidges(baseY: number, highlight: string, shadow: string, amplitudeScale: number, time: number) {
    const { width, height } = this._canvas;

    for (let layer = 0; layer < 3; layer++) {
      const y = baseY + layer * height * 0.08;
      const amp = height * (0.028 + layer * 0.012) * amplitudeScale;

      this.ctx.beginPath();
      this.ctx.moveTo(0, height);
      this.ctx.lineTo(0, y);
      for (let i = 0; i <= 9; i++) {
        const x = (width / 9) * i;
        const ridgeY = y + Math.sin(i * 0.9 + time * (0.18 + layer * 0.04)) * amp;
        this.ctx.lineTo(x, ridgeY);
      }
      this.ctx.lineTo(width, height);
      this.ctx.closePath();
      this.ctx.fillStyle = layer === 0 ? highlight : shadow;
      this.ctx.fill();
    }
  }

  private drawBackdropWater(y: number, color: string, time: number) {
    const { width, height } = this._canvas;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.4;
    for (let i = 0; i < 12; i++) {
      const waveY = y + i * height * 0.035;
      this.ctx.globalAlpha = 0.7 - i * 0.045;
      this.ctx.beginPath();
      for (let step = 0; step <= 18; step++) {
        const x = (width / 18) * step;
        const py = waveY + Math.sin(step * 0.8 + time * 0.7 + i * 0.4) * height * 0.004;
        if (step === 0) this.ctx.moveTo(x, py);
        else this.ctx.lineTo(x, py);
      }
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawBackdropSun(x: number, y: number, radius: number, color: string) {
    const glow = this.ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
    glow.addColorStop(0.28, color);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawBackdropParticles(count: number, color: string, alpha: number, time: number) {
    const { width, height } = this._canvas;

    this.ctx.save();
    for (let i = 0; i < count; i++) {
      const x = width * ((i * 0.137 + Math.sin(time * 0.12 + i) * 0.018) % 1);
      const y = height * (0.06 + ((i * 0.091 + time * (0.005 + (i % 4) * 0.002)) % 0.82));
      const size = Math.max(1.2, Math.min(width, height) * (0.002 + (i % 3) * 0.001));
      this.ctx.globalAlpha = alpha * (0.42 + Math.sin(time * 1.4 + i) * 0.2 + 0.28);
      this.ctx.fillStyle = i % 3 === 0 ? color : 'rgba(255, 255, 255, 0.88)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawAuroraRibbons(time: number, accent: string) {
    const { width, height } = this._canvas;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      const gradient = this.ctx.createLinearGradient(0, 0, width, height * 0.5);
      gradient.addColorStop(0, 'rgba(112, 255, 208, 0)');
      gradient.addColorStop(0.5, ribbon % 2 === 0 ? 'rgba(112, 255, 208, 0.14)' : `rgba(160, 190, 255, 0.13)`);
      gradient.addColorStop(1, 'rgba(112, 255, 208, 0)');
      this.ctx.strokeStyle = ribbon === 2 ? accent : gradient;
      this.ctx.globalAlpha = ribbon === 2 ? 0.1 : 1;
      this.ctx.lineWidth = height * (0.035 + ribbon * 0.012);
      this.ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const x = (width / 12) * i;
        const y = height * (0.18 + ribbon * 0.06) + Math.sin(i * 0.9 + time * (0.32 + ribbon * 0.1)) * height * 0.045;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawBackdropSkyline(baseY: number, accent: string, time: number) {
    const { width, height } = this._canvas;

    this.ctx.save();
    for (let i = 0; i < 16; i++) {
      const buildingWidth = width * (0.045 + (i % 3) * 0.012);
      const x = width * 0.02 + i * width * 0.064;
      const h = height * (0.12 + ((i * 7) % 9) * 0.017);
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(3, 7, 18, 0.72)' : 'rgba(7, 12, 24, 0.64)';
      this.ctx.fillRect(x, baseY - h, buildingWidth, h);

      this.ctx.fillStyle = i % 3 === 0 ? accent : 'rgba(255, 238, 180, 0.52)';
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 2; col++) {
          if ((row + col + i) % 3 === 0) continue;
          this.ctx.globalAlpha = 0.18 + Math.sin(time + i + row) * 0.04;
          this.ctx.fillRect(
            x + buildingWidth * (0.24 + col * 0.34),
            baseY - h + 12 + row * 18,
            buildingWidth * 0.12,
            5
          );
        }
      }
    }
    this.ctx.restore();
  }

  private drawBackdropSpire(x: number, baseY: number, height: number, accent: string) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(8, 13, 28, 0.58)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * height * 0.18;
      const spireHeight = height * (0.78 + i * 0.12);
      const width = height * (0.12 + i * 0.02);
      this.ctx.beginPath();
      this.ctx.moveTo(x + offset, baseY - spireHeight);
      this.ctx.lineTo(x + offset - width, baseY);
      this.ctx.lineTo(x + offset + width, baseY);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.drawGlowOrb(x, baseY - height * 0.64, height * 0.16, accent, 'rgba(255, 255, 255, 0)');
    this.ctx.restore();
  }

  private drawBackdropLeaves(time: number, accent: string) {
    const { width, height } = this._canvas;
    for (let i = 0; i < 12; i++) {
      const x = width * (0.04 + ((i * 0.17 + time * 0.014) % 0.92));
      const y = height * (0.12 + ((i * 0.11 + time * 0.01) % 0.76));
      this.drawLeaf(x, y, Math.max(8, width * 0.012), Math.sin(time + i) * 0.8, i % 2 === 0 ? accent : '#a7f3d0');
    }
  }

  private drawBackdropPetals(time: number, accent: string) {
    const { width, height } = this._canvas;
    for (let i = 0; i < 16; i++) {
      const x = width * (0.05 + ((i * 0.13 + time * 0.01) % 0.9));
      const y = height * (0.08 + ((i * 0.097 + time * 0.018) % 0.78));
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(Math.sin(time + i) * 0.8);
      this.ctx.globalAlpha = 0.16;
      this.ctx.fillStyle = i % 3 === 0 ? accent : '#ffd6e7';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, width * 0.006, width * 0.012, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
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
    renderParameters.camera.renderScene(
      this.ctx,
      () => {
        this.onBeforeEntities();
        this.renderEntities(renderParameters.entities);
        this.renderFinishGate(renderParameters.stage, renderParameters.camera.zoom * initialZoom);
        this.renderEffects(renderParameters);
        if (!renderParameters.winner) {
          this.renderMarbles(renderParameters);
        }
      },
      renderParameters.stage.presentation
    );
    this.ctx.restore();
    this.onAfterScene();

    uiObjects.forEach((obj) => obj.render(this.ctx, renderParameters, this._canvas.width, this._canvas.height));
    renderParameters.particleManager.render(this.ctx);
    this.renderWinner(renderParameters);
    if (renderParameters.goalSpotlight) {
      this.renderGoalSpotlightBanner(renderParameters.goalSpotlight, this._canvas.width, this._canvas.height);
    }
  }

  private renderEntities(entities: MapEntityState[]) {
    this.ctx.save();
    entities.forEach((entity) => {
      const transform = this.ctx.getTransform();
      const shapeColor = entity.shape.color;
      const isInvisible =
        shapeColor === 'transparent' || shapeColor === 'rgba(0, 0, 0, 0)' || shapeColor === 'rgba(0,0,0,0)';
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
            if (!isInvisible) {
              this.drawRailNodes(entity.shape.points);
            }
          }
          break;
        case 'box': {
          const w = entity.shape.width * 2;
          const h = entity.shape.height * 2;
          this.ctx.rotate(entity.shape.rotation);
          this.ctx.fillRect(-w / 2, -h / 2, w, h);
          this.ctx.strokeRect(-w / 2, -h / 2, w, h);
          if (!isInvisible) {
            this.drawBlockObstacleDetail(w, h);
          }
          break;
        }
        case 'circle':
          if (!isInvisible) {
            this.ctx.save();
            this.ctx.globalAlpha *= 0.22;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, entity.shape.radius, 0, Math.PI * 2, false);
            this.ctx.fill();
            this.ctx.restore();
          }
          this.ctx.beginPath();
          this.ctx.arc(0, 0, entity.shape.radius, 0, Math.PI * 2, false);
          this.ctx.stroke();
          if (!isInvisible) {
            this.drawRoundObstacleDetail(entity.shape.radius);
          }
          break;
      }

      this.ctx.setTransform(transform);
    });
    this.ctx.restore();
  }

  private drawRailNodes(points: [number, number][]) {
    this.ctx.save();
    this.ctx.shadowBlur *= 0.72;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
    this.ctx.lineWidth = 0.045;
    points.forEach(([x, y], index) => {
      if (index % 2 !== 0 && index !== points.length - 1) return;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 0.12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
    this.ctx.restore();
  }

  private drawBlockObstacleDetail(width: number, height: number) {
    const stripeInset = Math.min(width, height) * 0.34;

    this.ctx.save();
    this.ctx.shadowBlur *= 0.45;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    this.ctx.lineWidth = Math.max(0.025, Math.min(width, height) * 0.16);
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2 + stripeInset, height / 2 - stripeInset);
    this.ctx.lineTo(width / 2 - stripeInset, -height / 2 + stripeInset);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    this.ctx.beginPath();
    this.ctx.arc(-width / 2 + stripeInset * 0.8, -height / 2 + stripeInset * 0.8, stripeInset * 0.26, 0, Math.PI * 2);
    this.ctx.arc(width / 2 - stripeInset * 0.8, height / 2 - stripeInset * 0.8, stripeInset * 0.26, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawRoundObstacleDetail(radius: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.shadowBlur *= 0.55;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
    this.ctx.lineWidth = Math.max(0.025, radius * 0.12);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.72, -Math.PI * 0.15, Math.PI * 1.15);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    this.ctx.beginPath();
    this.ctx.arc(-radius * 0.22, -radius * 0.24, radius * 0.16, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private renderFinishGate(stage: StageDef, zoom: number) {
    const finishLine = stage.goalY - (stage.finishMargin ?? 0);
    const accent = stage.accent ?? this._theme.marbleWinningBorder;
    const now = performance.now() / 1000;
    const pulse = (Math.sin(now * 4.4) + 1) / 2;
    const centerX = 13;
    const gateLeft = centerX - 3.35;
    const gateRight = centerX + 3.35;
    const lineWidth = Math.max(0.026, 0.11 / zoom);

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = accent;
    this.ctx.shadowBlur = (14 + pulse * 16) / zoom;

    for (let i = 0; i < 4; i++) {
      const y = finishLine - 7.4 + i * 1.85;
      const alpha = 0.12 + i * 0.055 + pulse * 0.04;
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = accent;
      this.ctx.lineWidth = lineWidth * (1.1 + i * 0.25);
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 1.35 - i * 0.46, y);
      this.ctx.lineTo(centerX, y + 0.82);
      this.ctx.lineTo(centerX + 1.35 + i * 0.46, y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 0.78;
    this.ctx.strokeStyle = accent;
    this.ctx.lineWidth = lineWidth * 1.7;
    this.ctx.beginPath();
    this.ctx.moveTo(gateLeft, finishLine);
    this.ctx.lineTo(gateRight, finishLine);
    this.ctx.stroke();

    const tileCount = 14;
    const tileWidth = (gateRight - gateLeft) / tileCount;
    for (let i = 0; i < tileCount; i++) {
      this.ctx.globalAlpha = 0.75;
      this.ctx.fillStyle = i % 2 === 0 ? this._theme.winnerText : 'rgba(15, 23, 42, 0.78)';
      this.ctx.fillRect(gateLeft + i * tileWidth, finishLine - 0.18, tileWidth * 0.92, 0.36);
    }

    this.ctx.globalAlpha = 0.58 + pulse * 0.22;
    this.ctx.strokeStyle = this._theme.winnerText;
    this.ctx.lineWidth = lineWidth;
    [gateLeft, gateRight].forEach((x, index) => {
      this.ctx.beginPath();
      this.ctx.moveTo(x, finishLine - 2.65);
      this.ctx.lineTo(x, finishLine + 1.85);
      this.ctx.stroke();
      this.ctx.fillStyle = index === 0 ? accent : this._theme.winnerText;
      this.ctx.beginPath();
      this.ctx.moveTo(x, finishLine - 2.65);
      this.ctx.lineTo(x + (index === 0 ? 0.95 : -0.95), finishLine - 2.18);
      this.ctx.lineTo(x, finishLine - 1.72);
      this.ctx.closePath();
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 0.18 + pulse * 0.14;
    this.ctx.strokeStyle = accent;
    this.ctx.lineWidth = lineWidth * 0.72;
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, finishLine, 2.05 + pulse * 0.22, 0.52 + pulse * 0.1, 0, 0, Math.PI * 2);
    this.ctx.stroke();

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
      if (i < 3) {
        this.renderRankAura(marble, i + 1, camera.zoom * initialZoom, stage.presentation);
      }
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

  private renderRankAura(
    marble: Marble,
    rank: number,
    zoom: number,
    presentation: StageDef['presentation'] = 'default'
  ) {
    const rankColors = ['#facc15', '#93c5fd', '#fb923c'];
    const color = rankColors[rank - 1] ?? this._theme.marbleWinningBorder;
    const now = performance.now() / 1000;
    const pulse = (Math.sin(now * (5.2 - rank * 0.45)) + 1) / 2;
    const radius = marble.size * (0.98 + pulse * 0.08);
    const trailDirection = presentation === 'side-scroll' ? { x: -1, y: 0 } : { x: 0, y: -1 };

    this.ctx.save();
    this.ctx.translate(marble.x, marble.y);
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = (16 - rank * 2 + pulse * 8) / zoom;

    for (let i = 0; i < 5; i++) {
      const distance = marble.size * (0.98 + i * 0.46 + rank * 0.06);
      const width = marble.size * (0.28 - i * 0.032);
      this.ctx.globalAlpha = (0.32 - i * 0.044) * (rank === 1 ? 1.12 : 0.92);
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.ellipse(
        trailDirection.x * distance,
        trailDirection.y * distance,
        Math.max(0.08, width),
        Math.max(0.035, width * 0.42),
        presentation === 'side-scroll' ? 0 : Math.PI / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 0.9;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = Math.max(0.024, 0.12 / zoom);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.rotate(now * (rank % 2 === 0 ? -1.25 : 1.35));
    this.ctx.globalAlpha = 0.74;
    this.ctx.strokeStyle = rank === 1 ? this._theme.winnerText : color;
    this.ctx.lineWidth = Math.max(0.025, 0.16 / zoom);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius + 0.14, -0.72, 0.86);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius + 0.14, Math.PI - 0.72, Math.PI + 0.86);
    this.ctx.stroke();

    this.ctx.restore();
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

  private drawBatSpecter(x: number, y: number, size: number, alpha = 1) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = 'rgba(31, 41, 55, 0.94)';
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.7, 0);
    this.ctx.quadraticCurveTo(-size * 0.34, -size * 0.4, -size * 0.06, -size * 0.08);
    this.ctx.quadraticCurveTo(0, -size * 0.46, size * 0.06, -size * 0.08);
    this.ctx.quadraticCurveTo(size * 0.34, -size * 0.4, size * 0.7, 0);
    this.ctx.quadraticCurveTo(size * 0.26, size * 0.08, size * 0.18, size * 0.32);
    this.ctx.quadraticCurveTo(0, size * 0.2, -size * 0.18, size * 0.32);
    this.ctx.quadraticCurveTo(-size * 0.26, size * 0.08, -size * 0.7, 0);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 245, 208, 0.96)';
    this.ctx.beginPath();
    this.ctx.arc(-size * 0.12, 0, size * 0.08, 0, Math.PI * 2);
    this.ctx.arc(size * 0.12, 0, size * 0.08, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawStoneShoreline(centerX: number, baseY: number, width: number, height: number, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    this.ctx.fillStyle = 'rgba(77, 87, 104, 0.96)';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - width * 0.52, baseY);
    this.ctx.lineTo(centerX - width * 0.42, baseY - height * 0.36);
    this.ctx.lineTo(centerX + width * 0.42, baseY - height * 0.36);
    this.ctx.lineTo(centerX + width * 0.52, baseY);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(163, 170, 183, 0.92)';
    for (let i = 0; i < 8; i++) {
      const stoneX = centerX - width * 0.42 + width * 0.12 * i;
      const stoneY = baseY - height * (0.18 + (i % 2) * 0.08);
      this.ctx.beginPath();
      this.ctx.roundRect(stoneX, stoneY, width * 0.11, height * 0.18, 8);
      this.ctx.fill();
    }

    this.ctx.strokeStyle = 'rgba(241, 245, 249, 0.9)';
    this.ctx.lineWidth = Math.max(2.4, width * 0.006);
    this.ctx.beginPath();
    this.ctx.arc(centerX, baseY - height * 0.56, width * 0.34, Math.PI, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawShatteredHeavenBurst(centerX: number, centerY: number, radius: number, alpha = 1) {
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.globalAlpha = alpha;

    this.ctx.fillStyle = 'rgba(12, 10, 24, 0.72)';
    this.ctx.fillRect(-radius * 1.5, -radius * 1.2, radius * 3, radius * 2.4);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const inner = radius * (0.12 + (i % 3) * 0.04);
      const outer = radius * (0.42 + (i % 4) * 0.1);
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      this.ctx.lineTo(Math.cos(angle - 0.12) * outer, Math.sin(angle - 0.12) * outer);
      this.ctx.lineTo(Math.cos(angle + 0.12) * outer, Math.sin(angle + 0.12) * outer);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.lineWidth = Math.max(3, radius * 0.028);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    for (let i = 0; i < 11; i++) {
      const angle = (Math.PI * 2 * i) / 11;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(
        Math.cos(angle) * radius * (0.72 + (i % 3) * 0.16),
        Math.sin(angle) * radius * (0.68 + (i % 4) * 0.1)
      );
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawShockwaveRing(x: number, y: number, radius: number, thickness: number, color: string, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = thickness;
    this.ctx.shadowBlur = thickness * 2.4;
    this.ctx.shadowColor = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawSolarImpactSeal(x: number, y: number, radius: number, accent: string, alpha = 1, progress = 1) {
    if (alpha <= 0 || radius <= 0) {
      return;
    }

    const eased = this.easeOutCubic(this.clamp(progress));
    const innerRadius = radius * (0.22 + eased * 0.08);
    const midRadius = radius * (0.62 + eased * 0.18);
    const outerRadius = radius * (1.04 + eased * 0.26);

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalAlpha = alpha;

    const floorGlow = this.ctx.createRadialGradient(0, 0, innerRadius * 0.2, 0, 0, outerRadius * 1.06);
    floorGlow.addColorStop(0, 'rgba(255, 253, 244, 0.96)');
    floorGlow.addColorStop(0.12, 'rgba(255, 243, 184, 0.92)');
    floorGlow.addColorStop(0.36, 'rgba(255, 210, 98, 0.72)');
    floorGlow.addColorStop(0.68, 'rgba(255, 183, 77, 0.24)');
    floorGlow.addColorStop(1, 'rgba(255, 183, 77, 0)');
    this.ctx.fillStyle = floorGlow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, outerRadius * 1.06, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 248, 214, 0.96)';
    this.ctx.lineWidth = Math.max(5, radius * 0.08);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, midRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(255, 207, 92, 0.92)';
    this.ctx.lineWidth = Math.max(3, radius * 0.04);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, outerRadius * 0.9, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.rotate(eased * 0.2);
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const rayWidth = radius * (0.08 + (i % 3) * 0.015);
      const rayInner = innerRadius * (0.72 + (i % 2) * 0.08);
      const rayOuter = outerRadius * (1.02 + (i % 4) * 0.08);
      this.ctx.save();
      this.ctx.rotate(angle);
      const rayGradient = this.ctx.createLinearGradient(rayInner, 0, rayOuter, 0);
      rayGradient.addColorStop(0, 'rgba(255, 247, 220, 0.9)');
      rayGradient.addColorStop(0.46, 'rgba(255, 210, 109, 0.76)');
      rayGradient.addColorStop(1, 'rgba(255, 188, 85, 0)');
      this.ctx.fillStyle = rayGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(rayInner, -rayWidth * 0.42);
      this.ctx.lineTo(rayOuter, -rayWidth * 0.14);
      this.ctx.lineTo(rayOuter, rayWidth * 0.14);
      this.ctx.lineTo(rayInner, rayWidth * 0.42);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.rotate(-eased * 0.2);
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + eased * 0.1;
      const shardInner = midRadius * (0.42 + (i % 2) * 0.06);
      const shardOuter = outerRadius * (0.8 + (i % 3) * 0.07);
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 252, 235, 0.84)' : accent;
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(angle) * shardInner, Math.sin(angle) * shardInner);
      this.ctx.lineTo(Math.cos(angle - 0.11) * shardOuter, Math.sin(angle - 0.11) * shardOuter);
      this.ctx.lineTo(Math.cos(angle + 0.11) * shardOuter, Math.sin(angle + 0.11) * shardOuter);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();

    this.drawShockwaveRing(x, y, midRadius * 0.88, Math.max(4, radius * 0.034), '#fff8dc', alpha * 0.76);
    this.drawShockwaveRing(x, y, outerRadius, Math.max(3, radius * 0.022), '#facc15', alpha * 0.44);
  }

  private drawSupportLiftBeam(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    alpha = 1,
    width = 12
  ) {
    if (alpha <= 0.01) {
      return;
    }

    const controlX = this.lerp(fromX, toX, 0.46) + (fromX - toX) * 0.08;
    const controlY = this.lerp(fromY, toY, 0.54) - Math.abs(toY - fromY) * 0.2;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.strokeStyle = 'rgba(255, 248, 220, 0.92)';
    this.ctx.lineWidth = width;
    this.ctx.shadowBlur = width * 2.2;
    this.ctx.shadowColor = color;
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    this.ctx.stroke();

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width * 0.42;
    this.ctx.shadowBlur = width * 1.3;
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawSupportMarble(marble: Marble, x: number, y: number, size: number, alpha: number, glow: string) {
    if (alpha <= 0.01) {
      return;
    }

    const marbleImage = options.marbleStyle === 'sprite' ? this.getMarbleImage(marble.name) : undefined;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = 'rgba(20, 10, 8, 0.22)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + size * 0.4, size * 0.6, size * 0.22, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalAlpha = alpha;
    if (marbleImage) {
      this.ctx.shadowBlur = size * 0.38;
      this.ctx.shadowColor = glow;
      this.ctx.drawImage(marbleImage, -size / 2, -size / 2, size, size);
    } else {
      drawMarbleLook(
        this.ctx,
        {
          x: 0,
          y: 0,
          size,
          hue: marble.hue,
          seed: marble.id,
          bounce: 0.34,
          glow,
        },
        options.marbleStyle === 'sprite' ? 'retro' : options.marbleStyle
      );
    }
    this.ctx.restore();
  }

  private drawMeteorFireball(x: number, y: number, size: number, angle: number, alpha = 1, accent = '#ff8a1c') {
    const tailLength = size * 3.2;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.globalAlpha = alpha;

    const tailGradient = this.ctx.createLinearGradient(-tailLength, 0, size * 0.35, 0);
    tailGradient.addColorStop(0, 'rgba(255, 98, 0, 0)');
    tailGradient.addColorStop(0.24, 'rgba(255, 140, 30, 0.32)');
    tailGradient.addColorStop(0.58, 'rgba(255, 202, 74, 0.76)');
    tailGradient.addColorStop(1, 'rgba(255, 250, 223, 0.96)');
    this.ctx.fillStyle = tailGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(-tailLength, 0);
    this.ctx.quadraticCurveTo(-tailLength * 0.58, -size * 0.78, size * 0.24, -size * 0.2);
    this.ctx.quadraticCurveTo(-tailLength * 0.24, 0, size * 0.24, size * 0.2);
    this.ctx.quadraticCurveTo(-tailLength * 0.58, size * 0.78, -tailLength, 0);
    this.ctx.fill();

    for (let i = 0; i < 6; i++) {
      const sparkX = -tailLength * (0.22 + i * 0.12);
      const sparkY = (i % 2 === 0 ? -1 : 1) * size * (0.14 + i * 0.03);
      this.drawSpark(sparkX, sparkY, size * (0.16 + i * 0.02), i % 2 === 0 ? '#fff8df' : accent, alpha * 0.7);
    }

    const fireGlow = this.ctx.createRadialGradient(0, 0, size * 0.12, 0, 0, size * 1.6);
    fireGlow.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    fireGlow.addColorStop(0.18, 'rgba(255, 241, 190, 0.96)');
    fireGlow.addColorStop(0.42, 'rgba(255, 176, 66, 0.9)');
    fireGlow.addColorStop(0.72, 'rgba(255, 108, 18, 0.58)');
    fireGlow.addColorStop(1, 'rgba(255, 108, 18, 0)');
    this.ctx.fillStyle = fireGlow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 1.6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#3b1b11';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 0.54, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#7a2d14';
    for (let i = 0; i < 5; i++) {
      const rockAngle = (Math.PI * 2 * i) / 5 + size * 0.01;
      this.ctx.beginPath();
      this.ctx.arc(Math.cos(rockAngle) * size * 0.22, Math.sin(rockAngle) * size * 0.18, size * 0.12, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.strokeStyle = '#ffd58f';
    this.ctx.lineWidth = Math.max(2, size * 0.08);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawImpactCracks(x: number, y: number, radius: number, alpha: number, accent: string) {
    if (alpha <= 0.01) {
      return;
    }

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = 'rgba(47, 23, 14, 0.9)';
    this.ctx.lineWidth = Math.max(2, radius * 0.045);
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI * 0.92 + (Math.PI * 1.84 * i) / 7;
      const reach = radius * (0.4 + (i % 3) * 0.18);
      const midX = x + Math.cos(angle) * reach * 0.54;
      const midY = y + Math.sin(angle) * reach * 0.28;
      const endX = x + Math.cos(angle) * reach;
      const endY = y + Math.sin(angle) * reach * 0.52;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(midX, midY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = accent;
    this.ctx.globalAlpha = alpha * 0.38;
    this.ctx.lineWidth = Math.max(1.2, radius * 0.02);
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 0.28, Math.PI * 0.1, Math.PI * 0.9);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawNovaBurst(x: number, y: number, radius: number, accent: string, alpha: number) {
    if (alpha <= 0.01) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalAlpha = alpha;

    const bloom = this.ctx.createRadialGradient(0, 0, radius * 0.04, 0, 0, radius);
    bloom.addColorStop(0, 'rgba(255, 255, 255, 1)');
    bloom.addColorStop(0.2, 'rgba(255, 251, 225, 0.98)');
    bloom.addColorStop(0.46, 'rgba(255, 224, 148, 0.92)');
    bloom.addColorStop(0.72, 'rgba(255, 186, 74, 0.46)');
    bloom.addColorStop(1, 'rgba(255, 186, 74, 0)');
    this.ctx.fillStyle = bloom;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.lineCap = 'round';
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const inner = radius * (0.14 + (i % 3) * 0.03);
      const outer = radius * (0.74 + (i % 5) * 0.08);
      this.ctx.save();
      this.ctx.rotate(angle);
      this.ctx.strokeStyle = i % 2 === 0 ? '#fffbe8' : accent;
      this.ctx.lineWidth = 2.4 + (i % 3) * 0.6;
      this.ctx.beginPath();
      this.ctx.moveTo(inner, 0);
      this.ctx.lineTo(outer, 0);
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.drawShockwaveRing(0, 0, radius * 0.56, Math.max(5, radius * 0.06), '#fff8d8', alpha * 0.8);
    this.drawShockwaveRing(0, 0, radius * 0.86, Math.max(4, radius * 0.042), accent, alpha * 0.55);
    this.ctx.restore();
  }

  private drawFinalePrismBurst(x: number, y: number, radius: number, accent: string, alpha: number, progress: number) {
    if (alpha <= 0.01) {
      return;
    }

    const eased = this.easeOutCubic(progress);

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.globalAlpha = alpha;

    const bloom = this.ctx.createRadialGradient(0, 0, radius * 0.02, 0, 0, radius * (1.1 + eased * 0.52));
    bloom.addColorStop(0, 'rgba(255, 255, 255, 1)');
    bloom.addColorStop(0.14, 'rgba(255, 248, 216, 0.92)');
    bloom.addColorStop(0.36, 'rgba(255, 206, 93, 0.5)');
    bloom.addColorStop(0.66, `rgba(255, 137, 50, ${0.18 + eased * 0.22})`);
    bloom.addColorStop(1, 'rgba(255, 137, 50, 0)');
    this.ctx.fillStyle = bloom;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * (1.1 + eased * 0.52), 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.lineCap = 'round';
    for (let ray = 0; ray < 44; ray++) {
      const angle = (Math.PI * 2 * ray) / 44 + eased * 0.22;
      const inner = radius * (0.1 + (ray % 4) * 0.018);
      const outer = radius * (0.68 + (ray % 7) * 0.08 + eased * 0.48);
      const width = Math.max(2.2, radius * (0.016 + (ray % 3) * 0.004));

      this.ctx.save();
      this.ctx.rotate(angle);
      this.ctx.strokeStyle = ray % 3 === 0 ? '#ffffff' : ray % 3 === 1 ? '#fff2b8' : accent;
      this.ctx.globalAlpha = alpha * (0.42 + eased * 0.38 - (ray % 5) * 0.024);
      this.ctx.lineWidth = width;
      this.ctx.beginPath();
      this.ctx.moveTo(inner, 0);
      this.ctx.lineTo(outer, 0);
      this.ctx.stroke();

      if (ray % 4 === 0) {
        this.ctx.fillStyle = ray % 2 === 0 ? '#ffffff' : accent;
        this.ctx.beginPath();
        this.ctx.moveTo(outer + radius * 0.08, 0);
        this.ctx.lineTo(outer, -radius * 0.035);
        this.ctx.lineTo(outer - radius * 0.09, 0);
        this.ctx.lineTo(outer, radius * 0.035);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    for (let ring = 0; ring < 4; ring++) {
      const ringProgress = this.clamp(eased - ring * 0.12);
      if (ringProgress <= 0) continue;
      this.drawShockwaveRing(
        0,
        0,
        radius * (0.62 + ringProgress * (1.35 + ring * 0.26)),
        Math.max(3.2, radius * (0.044 - ring * 0.006)),
        ring % 2 === 0 ? '#fff8dc' : accent,
        alpha * (0.54 - ring * 0.09) * (1 - ringProgress * 0.66)
      );
    }

    this.ctx.save();
    this.ctx.rotate(-eased * 0.3);
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * (0.38 + eased * 0.24)})`;
    this.ctx.lineWidth = Math.max(3, radius * 0.018);
    for (let shard = 0; shard < 9; shard++) {
      const angle = (Math.PI * 2 * shard) / 9;
      const shardRadius = radius * (0.38 + eased * (0.5 + (shard % 3) * 0.09));
      const shardSize = radius * (0.075 + (shard % 3) * 0.018);
      this.ctx.save();
      this.ctx.translate(Math.cos(angle) * shardRadius, Math.sin(angle) * shardRadius * 0.82);
      this.ctx.rotate(angle + eased * 0.7);
      this.ctx.beginPath();
      this.ctx.moveTo(0, -shardSize);
      this.ctx.lineTo(shardSize * 0.62, 0);
      this.ctx.lineTo(0, shardSize);
      this.ctx.lineTo(-shardSize * 0.62, 0);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.restore();
    }
    this.ctx.restore();

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
    this.ctx.arc(
      -size * 0.17,
      -size * 0.03,
      size * 0.07,
      Math.PI * (0.14 + blink * 0.04),
      Math.PI * (0.88 - blink * 0.05)
    );
    this.ctx.arc(
      size * 0.17,
      -size * 0.03,
      size * 0.07,
      Math.PI * (0.14 + blink * 0.04),
      Math.PI * (0.88 - blink * 0.05)
    );
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
      const fontSize =
        index === 0 ? Math.max(24, Math.min(34, width * 0.026)) : Math.max(20, Math.min(28, width * 0.021));

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

  private renderGoalSpotlightBanner(
    spotlight: NonNullable<RenderParameters['goalSpotlight']>,
    width: number,
    height: number
  ) {
    const progress = this.clamp(spotlight.elapsed / Math.max(1, spotlight.duration));
    const ease = this.easeOutCubic(Math.min(1, progress * 1.25));
    const fadeOut = 1 - this.clamp((progress - 0.72) / 0.28);
    const alpha = ease * fadeOut;
    if (alpha <= 0.01) {
      return;
    }

    const panelWidth = Math.min(width * 0.52, 560);
    const panelHeight = Math.min(height * 0.18, 148);
    const centerX = width / 2;
    const centerY = height * 0.46;
    const offsetY = (1 - ease) * 34;
    const mainLabel = spotlight.revealName ? spotlight.name : '당첨자 공개 대기';
    const statusLabel = '골인했습니다';
    const rankLabel = `${spotlight.rank}등 GOAL IN`;

    this.ctx.save();
    this.ctx.translate(centerX, centerY + offsetY);
    this.ctx.globalAlpha = alpha;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.lineJoin = 'round';

    this.ctx.fillStyle = 'rgba(12, 16, 28, 0.68)';
    this.ctx.strokeStyle = spotlight.accent;
    this.ctx.lineWidth = 2.4;
    this.ctx.beginPath();
    this.ctx.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 24);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = spotlight.accent;
    this.ctx.font = `800 ${Math.max(24, Math.min(34, width * 0.022))}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    this.ctx.fillStyle = spotlight.accent;
    this.ctx.fillText(`${spotlight.rank}등 GOAL IN`, 0, -30);

    this.ctx.shadowBlur = 0;
    this.ctx.font = `800 ${Math.max(spotlight.revealName ? 38 : 32, Math.min(spotlight.revealName ? 62 : 48, width * 0.04))}px 'Jua', 'Gowun Dodum', 'Malgun Gothic', sans-serif`;
    this.ctx.strokeStyle = 'rgba(9, 12, 20, 0.94)';
    this.ctx.lineWidth = 8;
    this.ctx.strokeText(mainLabel, 0, 6);
    this.ctx.fillStyle = '#fff8ef';
    this.ctx.fillText(mainLabel, 0, 6);
    this.ctx.font = `700 ${Math.max(18, Math.min(26, width * 0.016))}px 'IBM Plex Sans KR', 'Malgun Gothic', sans-serif`;
    this.ctx.fillStyle = 'rgba(255, 248, 239, 0.92)';
    this.ctx.fillText(statusLabel, 0, panelHeight * 0.24);

    this.ctx.restore();
  }

  private renderWinner({ winner, stage, podium, marbles, winners }: RenderParameters) {
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
    const finaleFlashProgress = this.clamp((elapsed - 3400) / 460);
    const finaleBarrageProgress = this.clamp((elapsed - 3600) / 2100);
    const infernoProgress = this.clamp((elapsed - 3040) / 1740);
    const meteorStormProgress = this.clamp((elapsed - 3360) / 1880);
    const shockwaveProgress = this.clamp((elapsed - 3500) / 1160);
    const zoomInProgress = this.clamp((elapsed - 2760) / 760);
    const zoomOutProgress = this.clamp((elapsed - 4040) / 980);
    const textProgress = this.clamp((elapsed - 4320) / 760);
    const podiumProgress = this.clamp((elapsed - 2480) / 620);
    const supportChargeProgress = this.clamp((elapsed - 60) / 1480);
    const supportLiftProgress = this.clamp((elapsed - 520) / 1760);
    const oceanRiseEase = this.easeOutBack(oceanRiseProgress);
    const landPauseEase = this.easeInOutCubic(landPauseProgress);
    const skyLaunchEase = this.easeInOutCubic(skyLaunchProgress);
    const seaToLandEase = this.easeInOutCubic(this.clamp((elapsed - 220) / 1880));
    const landToSkyEase = this.easeInOutCubic(this.clamp((elapsed - 1880) / 2240));
    const gatherEase = this.easeInOutCubic(gatherProgress);
    const coreBurstEase = this.easeOutCubic(coreBurstProgress);
    const burstEase = this.easeOutCubic(burstProgress);
    const finaleFlashEase = this.easeOutCubic(finaleFlashProgress);
    const finaleBarrageEase = this.easeOutCubic(finaleBarrageProgress);
    const infernoEase = this.easeOutCubic(infernoProgress);
    const meteorStormEase = this.easeOutCubic(meteorStormProgress);
    const shockwaveEase = this.easeOutCubic(shockwaveProgress);
    const supportChargeEase = this.easeInOutCubic(supportChargeProgress);
    const supportLiftEase = this.easeOutCubic(supportLiftProgress);
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
    const marbleSkyY = height * 0.46;
    const oceanLegY = this.lerp(marbleDeepSeaY, marbleSurfaceY, oceanRiseEase);
    const shoreLegY = this.lerp(marbleSurfaceY, marbleLandY, landPauseEase);
    const landHoverY = shoreLegY - Math.sin(time * 5.2) * 4.4 * (0.5 + (1 - skyLaunchProgress) * 0.5);
    const skyLegY = this.lerp(marbleLandY, marbleSkyY, skyLaunchEase);
    const baseMarbleCenterY =
      skyLaunchProgress > 0
        ? this.lerp(landHoverY, skyLegY, skyLaunchEase) - Math.sin(time * 8.4) * 12 * (1 - skyLaunchProgress)
        : landPauseProgress > 0
          ? this.lerp(oceanLegY, landHoverY, landPauseEase) - Math.sin(time * 7.6) * (4.4 + landPauseEase * 3.6)
          : oceanLegY - Math.sin(time * 7.4) * (5.6 + oceanRiseEase * 3.4);
    const supportLiftOffset =
      marbleVisualSize * (0.04 + supportChargeEase * 0.08 + supportLiftEase * 0.14) * (1 - coreBurstProgress * 0.18);
    const marbleCenterY = baseMarbleCenterY - supportLiftOffset;
    const islandAlpha = seaToLandEase * Math.max(0, 1 - skyLaunchProgress * 1.08);
    const nameY = centerY + nameSize * 0.14;
    const textOffsetY = (1 - textEase) * 42;
    const showText = textProgress > 0.01;
    const supportIds = new Set<number>();
    const supportMarbles = [...podium, ...winners, ...marbles]
      .filter((entry) => {
        if (entry.id === winner.id || supportIds.has(entry.id)) {
          return false;
        }
        supportIds.add(entry.id);
        return true;
      })
      .slice(0, 5);

    this.ctx.save();

    const oceanBackdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    oceanBackdrop.addColorStop(0, '#071423');
    oceanBackdrop.addColorStop(0.26, '#0a2a45');
    oceanBackdrop.addColorStop(0.62, '#0b5872');
    oceanBackdrop.addColorStop(1, '#06101f');
    this.ctx.fillStyle = oceanBackdrop;
    this.ctx.fillRect(0, 0, width, height);

    const cinematicDepth = this.ctx.createRadialGradient(
      centerX,
      height * 0.42,
      width * 0.08,
      centerX,
      height * 0.42,
      width * 0.78
    );
    cinematicDepth.addColorStop(0, 'rgba(255, 244, 205, 0.16)');
    cinematicDepth.addColorStop(0.34, 'rgba(14, 165, 233, 0.08)');
    cinematicDepth.addColorStop(1, 'rgba(2, 6, 23, 0.74)');
    this.ctx.fillStyle = cinematicDepth;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.globalAlpha = 0.12 + oceanRiseEase * 0.14;
    for (let i = 0; i < 7; i++) {
      const beamX = width * (0.1 + i * 0.14);
      const beamWidth = width * 0.045;
      const beamGradient = this.ctx.createLinearGradient(beamX, 0, beamX, height);
      beamGradient.addColorStop(0, 'rgba(201, 247, 255, 0.22)');
      beamGradient.addColorStop(0.55, 'rgba(123, 220, 241, 0.05)');
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
    landBackdrop.addColorStop(0, '#f8d38a');
    landBackdrop.addColorStop(0.22, '#db8b5f');
    landBackdrop.addColorStop(0.5, '#7b5b42');
    landBackdrop.addColorStop(0.72, '#0e7490');
    landBackdrop.addColorStop(1, '#082f49');
    this.ctx.fillStyle = landBackdrop;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();

    const skyRevealHeight = height * (0.18 + landToSkyEase * 0.94);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, width, skyRevealHeight);
    this.ctx.clip();
    const skyBackdrop = this.ctx.createLinearGradient(0, 0, 0, height);
    skyBackdrop.addColorStop(0, '#eaf9ff');
    skyBackdrop.addColorStop(0.18, '#b8ecff');
    skyBackdrop.addColorStop(0.48, '#4fb6d8');
    skyBackdrop.addColorStop(0.78, '#126782');
    skyBackdrop.addColorStop(1, 'rgba(8, 47, 73, 0)');
    this.ctx.fillStyle = skyBackdrop;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();

    const landTransitionGlow = this.ctx.createLinearGradient(
      0,
      landRevealY - height * 0.08,
      0,
      landRevealY + height * 0.08
    );
    landTransitionGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    landTransitionGlow.addColorStop(0.5, `rgba(255, 229, 181, ${0.12 + seaToLandEase * 0.22})`);
    landTransitionGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = landTransitionGlow;
    this.ctx.fillRect(0, landRevealY - height * 0.08, width, height * 0.16);

    const skyTransitionGlow = this.ctx.createLinearGradient(
      0,
      skyRevealHeight - height * 0.06,
      0,
      skyRevealHeight + height * 0.08
    );
    skyTransitionGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    skyTransitionGlow.addColorStop(0.5, `rgba(226, 248, 255, ${0.08 + landToSkyEase * 0.24})`);
    skyTransitionGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = skyTransitionGlow;
    this.ctx.fillRect(0, skyRevealHeight - height * 0.06, width, height * 0.14);

    const sunGlow = this.ctx.createRadialGradient(
      centerX,
      height * 0.16,
      width * 0.02,
      centerX,
      height * 0.16,
      width * 0.22
    );
    sunGlow.addColorStop(0, 'rgba(255, 251, 229, 0.76)');
    sunGlow.addColorStop(0.28, 'rgba(255, 214, 165, 0.38)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.save();
    this.ctx.globalAlpha = 0.08 + seaToLandEase * 0.18 + landToSkyEase * 0.24;
    this.ctx.fillStyle = sunGlow;
    this.ctx.fillRect(0, 0, width, height * 0.46);
    this.ctx.restore();

    this.drawCloudPuff(width * 0.18, height * 0.17, width * 0.07, 0.16 + landToSkyEase * 0.52);
    this.drawCloudPuff(width * 0.79, height * 0.2, width * 0.09, 0.18 + landToSkyEase * 0.54);
    this.drawCloudPuff(width * 0.56, height * 0.12, width * 0.06, 0.12 + landToSkyEase * 0.46 + burstEase * 0.2);
    this.drawCloudPuff(width * 0.34, height * 0.26, width * 0.08, 0.1 + landToSkyEase * 0.42 + burstEase * 0.18);

    const stageSpotlight = this.ctx.createRadialGradient(
      marbleCenterX,
      marbleCenterY,
      marbleVisualSize * 0.3,
      marbleCenterX,
      marbleCenterY,
      width * 0.46
    );
    stageSpotlight.addColorStop(0, 'rgba(255, 250, 219, 0.2)');
    stageSpotlight.addColorStop(0.36, `rgba(255, 210, 122, ${0.08 + gatherEase * 0.08})`);
    stageSpotlight.addColorStop(1, 'rgba(2, 6, 23, 0)');
    this.ctx.fillStyle = stageSpotlight;
    this.ctx.fillRect(0, 0, width, height);

    const cleanVignette = this.ctx.createRadialGradient(
      centerX,
      height * 0.48,
      width * 0.12,
      centerX,
      height * 0.48,
      width * 0.78
    );
    cleanVignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
    cleanVignette.addColorStop(0.58, 'rgba(2, 6, 23, 0.1)');
    cleanVignette.addColorStop(1, 'rgba(2, 6, 23, 0.5)');
    this.ctx.fillStyle = cleanVignette;
    this.ctx.fillRect(0, 0, width, height);

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
    this.ctx.quadraticCurveTo(
      centerX,
      islandY + marbleVisualSize * 0.19,
      centerX + width * 0.13,
      islandY + marbleVisualSize * 0.28
    );
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

    this.drawStoneShoreline(
      centerX,
      islandY + marbleVisualSize * 0.62,
      width * 0.42,
      marbleVisualSize * 1.24,
      islandAlpha
    );

    this.ctx.save();
    this.ctx.globalAlpha = islandAlpha;
    this.ctx.fillStyle = '#6c5137';
    this.ctx.beginPath();
    this.ctx.ellipse(
      centerX,
      islandY + marbleVisualSize * 0.46,
      width * 0.16,
      marbleVisualSize * 0.46,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.fillStyle = '#9ac55a';
    this.ctx.beginPath();
    this.ctx.ellipse(
      centerX,
      islandY + marbleVisualSize * 0.22,
      width * 0.145,
      marbleVisualSize * 0.2,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.restore();

    const supportAlpha = supportMarbles.length > 0 ? supportChargeEase * (0.34 + (1 - coreBurstProgress) * 0.82) : 0;
    if (supportAlpha > 0.02) {
      const supportSpread = Math.min(width * 0.34, marbleVisualSize * 4.2);
      const supportBaseY = height - marbleVisualSize * 0.58;

      const upliftGlow = this.ctx.createRadialGradient(
        marbleCenterX,
        marbleCenterY + marbleVisualSize * 0.42,
        marbleVisualSize * 0.18,
        marbleCenterX,
        marbleCenterY + marbleVisualSize * 0.42,
        marbleVisualSize * 2.2
      );
      upliftGlow.addColorStop(0, `rgba(255, 248, 226, ${0.22 + supportAlpha * 0.24})`);
      upliftGlow.addColorStop(0.32, `rgba(255, 214, 130, ${0.16 + supportAlpha * 0.22})`);
      upliftGlow.addColorStop(1, 'rgba(255, 214, 130, 0)');
      this.ctx.fillStyle = upliftGlow;
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY + marbleVisualSize * 0.42, marbleVisualSize * 2.2, 0, Math.PI * 2);
      this.ctx.fill();

      for (let ring = 0; ring < 3; ring++) {
        const ringProgress = (supportLiftEase + ring * 0.19) % 1;
        this.drawShockwaveRing(
          marbleCenterX,
          marbleCenterY + marbleVisualSize * 0.36,
          marbleVisualSize * (0.74 + ringProgress * (0.88 + ring * 0.18)),
          Math.max(2.6, marbleVisualSize * 0.03),
          ring % 2 === 0 ? '#fff4c8' : accent,
          supportAlpha * (0.34 - ring * 0.07) * (1 - ringProgress * 0.72)
        );
      }

      supportMarbles.forEach((supporter, index) => {
        const ratio = supportMarbles.length === 1 ? 0.5 : index / (supportMarbles.length - 1);
        const supportAngle = -0.5 + ratio * 1.0;
        const supportX =
          centerX - supportSpread + ratio * supportSpread * 2 + Math.sin(time * 2.2 + index * 0.9) * width * 0.012;
        const supportY =
          supportBaseY +
          Math.sin(time * 4.8 + index * 1.4) * (3 + (1 - supportLiftEase) * 3.5) +
          Math.abs(ratio - 0.5) * marbleVisualSize * 0.2;
        const supportSize = marbleVisualSize * (0.26 + (index % 2) * 0.025);
        const supportGlow = `hsl(${supporter.hue} 100% 72%)`;
        const beamAlpha = supportAlpha * (0.94 + (1 - Math.abs(ratio - 0.5) * 2) * 0.36);
        const targetX = marbleCenterX + supportAngle * marbleVisualSize * 0.18;
        const targetY = marbleCenterY + marbleVisualSize * 0.22;

        this.drawSupportLiftBeam(supportX, supportY, targetX, targetY, supportGlow, beamAlpha, supportSize * 0.3);
        this.drawSupportMarble(supporter, supportX, supportY, supportSize, 0.46 + beamAlpha * 0.5, supportGlow);

        for (let spark = 0; spark < 3; spark++) {
          const sparkProgress = (supportChargeEase * 0.84 + spark / 3 + index * 0.07) % 1;
          const sparkX = this.lerp(supportX, targetX, sparkProgress);
          const sparkY =
            this.lerp(supportY, targetY, sparkProgress) - Math.sin(sparkProgress * Math.PI) * marbleVisualSize * 0.08;
          this.drawSpark(
            sparkX,
            sparkY,
            3 + sparkProgress * 5,
            spark % 2 === 0 ? '#fff8e1' : supportGlow,
            beamAlpha * 0.7
          );
        }
      });
    }

    for (let i = 0; i < 5; i++) {
      const batAlpha = 0.18 + islandAlpha * 0.52 + landToSkyEase * 0.18;
      const batX = centerX - width * 0.16 + i * width * 0.08 + Math.sin(time * 1.8 + i) * width * 0.012;
      const batY = islandY - marbleVisualSize * (1.22 + (i % 2) * 0.16) - Math.cos(time * 2.2 + i) * 6;
      this.drawBatSpecter(batX, batY, marbleVisualSize * (0.18 + (i % 3) * 0.03), batAlpha);
    }

    this.drawImpactCracks(
      centerX,
      islandY + marbleVisualSize * 0.5,
      width * 0.14 + coreBurstEase * width * 0.06,
      islandAlpha * 0.42 + coreBurstEase * 0.58,
      accent
    );

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

    if (skyLaunchProgress > 0.08 || infernoProgress > 0) {
      for (let i = 0; i < 6; i++) {
        const emberProgress = (skyLaunchEase * 0.92 + infernoEase * 0.48 + i / 6) % 1;
        const emberX =
          marbleCenterX + Math.sin(time * 4.1 + i * 1.08) * marbleVisualSize * (0.18 + emberProgress * 0.16);
        const emberY = marbleCenterY + marbleVisualSize * (0.34 + emberProgress * 1.45);
        this.drawMeteorFireball(
          emberX,
          emberY,
          marbleVisualSize * (0.12 + (1 - emberProgress) * 0.08),
          -Math.PI / 2 + Math.sin(time * 2.7 + i) * 0.14,
          (0.16 + infernoEase * 0.3) * (1 - emberProgress),
          accent
        );
      }
    }

    for (let i = 0; i < 10; i++) {
      const bubbleProgress = (oceanRiseEase * 1.1 + i / 10) % 1;
      const bubbleX = centerX + Math.sin(time * 3 + i * 1.7) * marbleVisualSize * 0.42;
      const bubbleY =
        seaSurfaceY + marbleVisualSize * 0.7 + (1 - bubbleProgress) * (height - seaSurfaceY + marbleVisualSize * 0.9);
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
          this.ctx.lineTo(marbleCenterX + (px - marbleCenterX) * 0.26, marbleCenterY + (py - marbleCenterY) * 0.26);
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
      this.drawSolarImpactSeal(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * (1.18 + coreBurstEase * 1.48),
        accent,
        0.26 + coreBurstEase * 0.58,
        coreBurstEase
      );
      this.drawNovaBurst(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * (1.26 + coreBurstEase * 1.22),
        accent,
        0.28 + coreBurstEase * 0.56
      );
      this.drawFinalePrismBurst(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * (1.52 + coreBurstEase * 1.58),
        accent,
        0.28 + coreBurstEase * 0.7,
        coreBurstProgress
      );
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

    if (finaleFlashProgress > 0) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.globalAlpha = Math.max(0, 0.34 * (1 - finaleFlashProgress) + finaleBarrageEase * 0.06);
      this.ctx.fillStyle = '#fffdf2';
      this.ctx.fillRect(0, 0, width, height);

      const lensGlow = this.ctx.createRadialGradient(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * 0.24,
        marbleCenterX,
        marbleCenterY,
        width * (0.42 + finaleFlashEase * 0.22)
      );
      lensGlow.addColorStop(0, 'rgba(255, 255, 255, 0.58)');
      lensGlow.addColorStop(0.18, `rgba(255, 237, 168, ${0.32 + finaleFlashEase * 0.2})`);
      lensGlow.addColorStop(0.55, `rgba(255, 162, 63, ${0.14 + finaleFlashEase * 0.12})`);
      lensGlow.addColorStop(1, 'rgba(255, 162, 63, 0)');
      this.ctx.fillStyle = lensGlow;
      this.ctx.beginPath();
      this.ctx.arc(marbleCenterX, marbleCenterY, width * (0.42 + finaleFlashEase * 0.22), 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + (1 - finaleFlashProgress) * 0.42})`;
      this.ctx.lineWidth = Math.max(6, marbleVisualSize * 0.06);
      this.ctx.beginPath();
      this.ctx.moveTo(width * 0.08, marbleCenterY);
      this.ctx.lineTo(width * 0.92, marbleCenterY);
      this.ctx.stroke();
      this.ctx.restore();
    }

    if (meteorStormProgress > 0) {
      for (let i = 0; i < 7; i++) {
        const localMeteor = this.clamp((elapsed - 3480 - i * 118) / 1180);
        if (localMeteor <= 0 || localMeteor >= 1) {
          continue;
        }

        const startX = width * (0.08 + (i % 4) * 0.22) + (i % 2 === 0 ? -width * 0.06 : width * 0.06);
        const startY = -height * (0.14 + (i % 3) * 0.04);
        const impactX = centerX + (i - 3) * width * 0.11;
        const impactY = height * (0.18 + (i % 3) * 0.1);
        const meteorEase = this.easeInOutCubic(localMeteor);
        const meteorX = this.lerp(startX, impactX, meteorEase);
        const meteorY = this.lerp(startY, impactY, meteorEase);
        const meteorAngle = Math.atan2(impactY - startY, impactX - startX);
        const meteorSize = marbleVisualSize * (0.18 + (i % 3) * 0.045) * (1.08 - localMeteor * 0.24);
        const meteorAlpha = (1 - localMeteor) * (0.44 + meteorStormEase * 0.36);

        this.drawMeteorFireball(meteorX, meteorY, meteorSize, meteorAngle, meteorAlpha, accent);

        if (localMeteor > 0.72) {
          this.drawShockwaveRing(
            impactX,
            impactY,
            meteorSize * (0.8 + (localMeteor - 0.72) * 4.6),
            Math.max(3, meteorSize * 0.14),
            i % 2 === 0 ? '#fff0ba' : accent,
            (1 - localMeteor) * 0.55
          );
        }
      }
    }

    if (coreBurstProgress > 0.08) {
      this.drawShatteredHeavenBurst(
        marbleCenterX,
        marbleCenterY - marbleVisualSize * 0.1,
        marbleVisualSize * (1.54 + coreBurstEase * 1.18),
        Math.max(0, 0.12 + coreBurstEase * 0.56 - burstProgress * 0.3)
      );
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
      { x: width * 0.32, y: height * 0.36 },
      { x: width * 0.68, y: height * 0.34 },
      { x: width * 0.18, y: height * 0.42 },
      { x: width * 0.82, y: height * 0.4 },
      { x: centerX, y: height * 0.08 },
    ];

    for (let i = 0; i < burstAnchors.length; i++) {
      const localBurst = this.clamp((elapsed - 3740 - i * 118) / 1240);
      if (localBurst <= 0) continue;
      const burstAlpha = (1 - localBurst) * (0.52 + finaleBarrageEase * 0.38);
      const burstX = burstAnchors[i].x;
      const burstY = burstAnchors[i].y;
      const burstRadius = width * (0.046 + (i % 4) * 0.012) * (0.54 + localBurst * 1.54);

      this.ctx.save();
      this.ctx.translate(burstX, burstY);
      this.ctx.rotate(i * 0.34 + localBurst * 0.55);
      this.ctx.strokeStyle = i % 2 === 0 ? accent : '#fff7d6';
      this.ctx.lineWidth = 4.4;
      this.ctx.globalAlpha = burstAlpha;
      for (let ray = 0; ray < 28; ray++) {
        const angle = (Math.PI * 2 * ray) / 28;
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

      for (let spark = 0; spark < 11; spark++) {
        const sparkAngle = (Math.PI * 2 * spark) / 11 + i * 0.38;
        this.drawSpark(
          burstX + Math.cos(sparkAngle) * burstRadius * 0.84,
          burstY + Math.sin(sparkAngle) * burstRadius * 0.84,
          6 + localBurst * 10,
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
        const trailX =
          marbleCenterX + Math.sin(time * 4.1 + i * 0.92) * marbleVisualSize * (0.14 + trailProgress * 0.08);
        this.drawCloudPuff(
          trailX,
          trailY,
          marbleVisualSize * (0.16 + (1 - trailProgress) * 0.18),
          (1 - trailProgress) * 0.16 * skyLaunchProgress
        );
      }
    }

    const infernoGlow = this.ctx.createRadialGradient(
      marbleCenterX,
      marbleCenterY,
      marbleVisualSize * 0.18,
      marbleCenterX,
      marbleCenterY,
      marbleVisualSize * (1.42 + infernoEase * 0.44)
    );
    infernoGlow.addColorStop(0, `rgba(255, 255, 255, ${0.2 + infernoEase * 0.14})`);
    infernoGlow.addColorStop(0.18, `rgba(255, 240, 185, ${0.18 + infernoEase * 0.2})`);
    infernoGlow.addColorStop(0.42, `rgba(255, 170, 55, ${0.14 + infernoEase * 0.26})`);
    infernoGlow.addColorStop(0.76, `rgba(255, 92, 18, ${0.06 + infernoEase * 0.18})`);
    infernoGlow.addColorStop(1, 'rgba(255, 92, 18, 0)');
    this.ctx.fillStyle = infernoGlow;
    this.ctx.beginPath();
    this.ctx.arc(marbleCenterX, marbleCenterY, marbleVisualSize * (1.42 + infernoEase * 0.44), 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.save();
    this.ctx.translate(marbleCenterX, marbleCenterY);
    if (marbleImage) {
      this.ctx.drawImage(marbleImage, -marbleVisualSize / 2, -marbleVisualSize / 2, marbleVisualSize, marbleVisualSize);
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
    if (shockwaveProgress > 0) {
      this.drawSolarImpactSeal(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * (1.06 + shockwaveEase * 2.16),
        accent,
        (1 - shockwaveProgress) * 0.42,
        shockwaveEase
      );
      this.drawShockwaveRing(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * (1.18 + shockwaveEase * 2.08),
        Math.max(5, marbleVisualSize * 0.08),
        '#fff7dd',
        (1 - shockwaveProgress) * 0.72
      );
      this.drawShockwaveRing(
        marbleCenterX,
        marbleCenterY,
        marbleVisualSize * (1.58 + shockwaveEase * 2.72),
        Math.max(3, marbleVisualSize * 0.05),
        accent,
        (1 - shockwaveProgress) * 0.46
      );
    }
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
      this.ctx.fillText(
        '바다를 뚫고 지상을 지나 구름 하늘에서 승리 폭발!',
        centerX,
        nameY + nameSize * 0.94 + textOffsetY * 0.16
      );
    }
    this.ctx.restore();
  }
}
