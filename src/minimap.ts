import { initialZoom } from './data/constants';
import type { RenderParameters } from './rouletteRenderer';
import type { ColorTheme } from './types/ColorTheme';
import type { MapEntityState } from './types/MapEntity.type';
import type { Rect } from './types/rect.type';
import type { VectorLike } from './types/VectorLike';
import type { UIObject } from './UIObject';
import { bound } from './utils/bound.decorator';

export class Minimap implements UIObject {
  private ctx!: CanvasRenderingContext2D;
  private lastParams: RenderParameters | null = null;
  private readonly _trackWidth = 26;
  private readonly _baseScale = 2.25;
  private readonly _maxWidthRatio = 0.14;
  private readonly _maxHeightRatio = 0.27;
  private readonly _maxWidth = 220;
  private readonly _maxHeight = 240;
  private _scale = this._baseScale;

  private _onViewportChangeHandler: ((pos?: VectorLike) => void) | null = null;
  private boundingBox: Rect;
  private mousePosition: { x: number; y: number } | null = null;

  constructor() {
    this.boundingBox = {
      x: 10,
      y: 10,
      w: 26 * 4,
      h: 0,
    };
  }

  getBoundingBox(): Rect | null {
    return this.boundingBox;
  }

  onViewportChange(callback: (pos?: VectorLike) => void) {
    this._onViewportChangeHandler = callback;
  }

  update(): void {
    // nothing to do
  }

  @bound
  onMouseMove(e?: { x: number; y: number }) {
    if (!e) {
      this.mousePosition = null;
      if (this._onViewportChangeHandler) {
        this._onViewportChangeHandler();
      }
      return;
    }
    if (!this.lastParams) return;
    this.mousePosition = {
      x: e.x,
      y: e.y,
    };
    if (this._onViewportChangeHandler) {
      const scale = this._scale;
      const isSideScroll = this.lastParams.stage.presentation === 'side-scroll';
      this._onViewportChangeHandler(
        isSideScroll
          ? {
              x: this._trackWidth - this.mousePosition.y / scale,
              y: this.mousePosition.x / scale,
            }
          : {
              x: this.mousePosition.x / scale,
              y: this.lastParams.camera.toWorldY(this.mousePosition.y / scale),
            }
      );
    }
  }

  render(ctx: CanvasRenderingContext2D, params: RenderParameters) {
    if (!ctx) return;
    const { stage } = params;
    if (!stage) return;
    const isSideScroll = stage.presentation === 'side-scroll';
    const mapWidth = isSideScroll ? stage.goalY : this._trackWidth;
    const mapHeight = isSideScroll ? this._trackWidth : stage.goalY;
    this._scale = this.getScale(mapWidth, mapHeight, ctx.canvas.width, ctx.canvas.height);
    this.boundingBox.w = mapWidth * this._scale;
    this.boundingBox.h = mapHeight * this._scale;

    this.lastParams = params;

    this.ctx = ctx;
    ctx.save();
    ctx.fillStyle = params.theme.minimapBackground;
    ctx.translate(10, 10);
    ctx.scale(this._scale, this._scale);
    if (isSideScroll) {
      ctx.transform(0, -1, 1, 0, 0, this._trackWidth);
    } else if (Math.abs(params.camera.toVisualY(0)) > 0.001) {
      ctx.translate(0, stage.goalY);
      ctx.scale(1, -1);
    }
    ctx.fillRect(0, 0, this._trackWidth, stage.goalY);

    this.ctx.lineWidth = 3 / (params.camera.zoom + initialZoom);
    this.drawEntities(params.entities, params.theme);
    this.drawMarbles(params);
    this.drawViewport(params);

    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.46)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.w, this.boundingBox.h);
    ctx.restore();
  }

  private getScale(mapWidth: number, mapHeight: number, canvasWidth: number, canvasHeight: number) {
    const maxWidth = Math.min(this._maxWidth, canvasWidth * this._maxWidthRatio);
    const maxHeight = Math.min(this._maxHeight, canvasHeight * this._maxHeightRatio);
    return Math.max(1.05, Math.min(this._baseScale, maxWidth / mapWidth, maxHeight / mapHeight));
  }

  private drawViewport(params: RenderParameters) {
    this.ctx.save();
    const { camera, size, stage } = params;
    const zoom = camera.zoom * initialZoom;
    const cameraWorld = camera.getViewportCenter(stage);
    const viewW = size.x / zoom;
    const viewH = size.y / zoom;
    const w = stage.presentation === 'side-scroll' ? viewH : viewW;
    const h = stage.presentation === 'side-scroll' ? viewW : viewH;
    this.ctx.strokeStyle = params.theme.minimapViewport;
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.strokeRect(cameraWorld.x - w / 2, cameraWorld.y - h / 2, w, h);
    this.ctx.restore();
  }

  private drawEntities(entities: MapEntityState[], theme: ColorTheme) {
    this.ctx.save();
    entities.forEach((entity) => {
      this.ctx.save();
      this.ctx.fillStyle = entity.shape.color ?? theme.entity[entity.shape.type].fill;
      this.ctx.strokeStyle = entity.shape.color ?? theme.entity[entity.shape.type].outline;
      this.ctx.translate(entity.x, entity.y);
      this.ctx.rotate(entity.angle);

      this.ctx.save();
      const shape = entity.shape;
      switch (shape.type) {
        case 'box': {
          const w = shape.width * 2;
          const h = shape.height * 2;
          this.ctx.rotate(shape.rotation);
          this.ctx.fillRect(-w / 2, -h / 2, w, h);
          break;
        }
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, shape.radius, 0, Math.PI * 2, false);
          this.ctx.stroke();
          break;
        case 'polyline':
          if (shape.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.points[0][0], shape.points[0][1]);
            for (let i = 1; i < shape.points.length; i++) {
              this.ctx.lineTo(shape.points[i][0], shape.points[i][1]);
            }
            this.ctx.stroke();
          }
          break;
      }
      this.ctx.restore();
      this.ctx.restore();
    });
    this.ctx.restore();
  }

  private drawMarbles(params: RenderParameters) {
    const { marbles } = params;
    const viewPort = {
      x: params.camera.x,
      y: params.camera.y,
      w: params.size.x,
      h: params.size.y,
      zoom: params.camera.zoom * initialZoom,
    };
    marbles.forEach((marble) => {
      marble.render(this.ctx, 1, false, true, undefined, viewPort, params.theme);
    });
  }
}
