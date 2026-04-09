import type { GameObject } from './gameObject';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';

const lifetime = 1550;

export type SeaCreatureKind = 'shark' | 'starfish' | 'octopus' | 'nakji' | 'jjukkumi' | 'mackerel' | 'beltfish';
export type SeaCreatureSweepAxis = 'horizontal' | 'vertical';

export class SharkRushEffect implements GameObject {
  public isDestroy = false;
  private _elapsed = 0;
  private _start: VectorLike;
  private _end: VectorLike;
  private _previousPosition: VectorLike;
  private _direction: VectorLike;
  private _normal: VectorLike;
  private _accent: string;
  private _creature: SeaCreatureKind;
  private _hitMarbles = new Set<number>();

  constructor(start: VectorLike, end: VectorLike, accent?: string, creature?: SeaCreatureKind);
  constructor(
    start: number,
    end: number,
    fixed: number,
    direction: -1 | 1,
    accent?: string,
    creature?: SeaCreatureKind,
    axis?: SeaCreatureSweepAxis,
    rotation?: number
  );
  constructor(
    start: number | VectorLike,
    end: number | VectorLike,
    third?: number | string,
    fourth?: -1 | 1 | SeaCreatureKind,
    fifth = '#60a5fa',
    sixth: SeaCreatureKind = 'shark',
    seventh: SeaCreatureSweepAxis = 'horizontal',
    _eighth = 0
  ) {
    void _eighth;
    if (typeof start === 'number' && typeof end === 'number' && typeof third === 'number' && (fourth === -1 || fourth === 1)) {
      const fixed = third;
      this._start = seventh === 'horizontal' ? { x: start, y: fixed } : { x: fixed, y: start };
      this._end = seventh === 'horizontal' ? { x: end, y: fixed } : { x: fixed, y: end };
      this._accent = fifth;
      this._creature = sixth;
    } else {
      this._start = start as VectorLike;
      this._end = end as VectorLike;
      this._accent = typeof third === 'string' ? third : '#60a5fa';
      this._creature = typeof fourth === 'string' ? fourth : 'shark';
    }

    const deltaX = this._end.x - this._start.x;
    const deltaY = this._end.y - this._start.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    this._previousPosition = { ...this._start };
    this._direction = { x: deltaX / distance, y: deltaY / distance };
    this._normal = { x: -this._direction.y, y: this._direction.x };
  }

  update(deltaTime: number) {
    this._previousPosition = this.getPosition();
    this._elapsed += deltaTime;
    if (this._elapsed >= lifetime) {
      this.isDestroy = true;
    }
  }

  getPosition(): VectorLike {
    const rate = this.getRate();
    const eased = 1 - (1 - rate) ** 3;
    const bob = Math.sin(rate * Math.PI * 3.2) * this.getBobAmplitude();
    return {
      x: this._start.x + (this._end.x - this._start.x) * eased + this._normal.x * bob,
      y: this._start.y + (this._end.y - this._start.y) * eased + this._normal.y * bob,
    };
  }

  getHeading(): VectorLike {
    return this._direction;
  }

  hasHitMarble(id: number) {
    return this._hitMarbles.has(id);
  }

  markHitMarble(id: number) {
    this._hitMarbles.add(id);
  }

  getContactStrength(point: VectorLike, marbleRadius = 0.25) {
    const profile = this.getCollisionProfile();
    const currentPosition = this.getPosition();
    const movement = Math.hypot(
      currentPosition.x - this._previousPosition.x,
      currentPosition.y - this._previousPosition.y
    );
    const directStrength = this.getCapsuleContactStrength(
      point,
      marbleRadius,
      currentPosition,
      profile.length,
      profile.width
    );
    if (movement <= 0.02) {
      return directStrength;
    }

    const sweptCenter = {
      x: (currentPosition.x + this._previousPosition.x) / 2,
      y: (currentPosition.y + this._previousPosition.y) / 2,
    };
    const sweptStrength = this.getCapsuleContactStrength(
      point,
      marbleRadius,
      sweptCenter,
      profile.length + movement * 1.5,
      profile.width + Math.min(0.48, movement * 0.8)
    );

    return Math.max(directStrength, sweptStrength);
  }

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme) {
    const rate = this.getRate();
    const position = this.getPosition();
    const alpha = Math.sin(Math.PI * Math.min(1, rate * 1.05));
    const bodyColor = this._accent;
    const angle = Math.atan2(this._direction.y, this._direction.x);

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.09 / zoom;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 16 / zoom;
    ctx.shadowColor = this._accent;

    this.drawTrail(ctx, rate, alpha);

    switch (this._creature) {
      case 'starfish':
        this.drawStarfish(ctx, rate, theme, bodyColor);
        break;
      case 'octopus':
        this.drawOctopus(ctx, rate, theme, bodyColor, 6, 0.9);
        break;
      case 'nakji':
        this.drawOctopus(ctx, rate, theme, bodyColor, 7, 0.72);
        break;
      case 'jjukkumi':
        this.drawOctopus(ctx, rate, theme, bodyColor, 5, 0.6);
        break;
      case 'mackerel':
        this.drawFish(ctx, theme, bodyColor, '#93c5fd', false);
        break;
      case 'beltfish':
        this.drawFish(ctx, theme, bodyColor, '#f8fafc', true);
        break;
      case 'shark':
      default:
        this.drawShark(ctx, theme, bodyColor);
        break;
    }

    ctx.restore();
  }

  private getRate() {
    return Math.min(1, this._elapsed / lifetime);
  }

  private getBobAmplitude() {
    switch (this._creature) {
      case 'starfish':
        return 0.28;
      case 'beltfish':
        return 0.22;
      default:
        return 0.38;
    }
  }

  private getCollisionProfile() {
    switch (this._creature) {
      case 'starfish':
        return { length: 2.35, width: 2.05 };
      case 'octopus':
        return { length: 2.55, width: 1.9 };
      case 'nakji':
        return { length: 2.3, width: 1.72 };
      case 'jjukkumi':
        return { length: 2.08, width: 1.54 };
      case 'mackerel':
        return { length: 2.92, width: 1.18 };
      case 'beltfish':
        return { length: 3.46, width: 1.04 };
      case 'shark':
      default:
        return { length: 3.6, width: 1.36 };
    }
  }

  private getCapsuleContactStrength(
    point: VectorLike,
    marbleRadius: number,
    center: VectorLike,
    bodyLength: number,
    bodyWidth: number
  ) {
    const offsetX = point.x - center.x;
    const offsetY = point.y - center.y;
    const along = offsetX * this._direction.x + offsetY * this._direction.y;
    const across = offsetX * this._normal.x + offsetY * this._normal.y;
    const halfLength = bodyLength / 2;
    const clampedAlong = Math.max(-halfLength, Math.min(halfLength, along));
    const capsuleDx = along - clampedAlong;
    const capsuleDistance = Math.hypot(capsuleDx, across);
    const threshold = bodyWidth / 2 + marbleRadius;
    if (capsuleDistance >= threshold) {
      return 0;
    }
    const centerBias = 1 - Math.min(1, Math.abs(along) / Math.max(0.001, halfLength + marbleRadius));
    return Math.max(0.22, 1 - capsuleDistance / threshold) * (0.62 + centerBias * 0.48);
  }

  private drawTrail(ctx: CanvasRenderingContext2D, rate: number, alpha: number) {
    for (let i = 0; i < 3; i++) {
      const bubbleX = -2.25 - i * 0.42;
      const bubbleY = -0.35 + i * 0.24 + Math.sin(rate * Math.PI * (2.1 + i * 0.25)) * 0.08;
      ctx.save();
      ctx.globalAlpha = alpha * (0.4 - i * 0.06);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(219, 244, 255, 0.95)' : 'rgba(255, 255, 255, 0.88)';
      ctx.lineWidth = 0.08;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, 0.1 + i * 0.045, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 0.085 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x + 0.015 * scale, y, 0.045 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSmile(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 0.14) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.08;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0.18, Math.PI * 0.92);
    ctx.stroke();
  }

  private drawShark(ctx: CanvasRenderingContext2D, theme: ColorTheme, bodyColor: string) {
    for (let i = 0; i < 2; i++) {
      const fishX = -1.95 - i * 0.58;
      const fishY = -0.42 + i * 0.42;
      ctx.save();
      ctx.translate(fishX, fishY);
      ctx.scale(0.38 + i * 0.05, 0.38 + i * 0.05);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(191,219,254,0.92)';
      ctx.beginPath();
      ctx.moveTo(-0.55, 0);
      ctx.bezierCurveTo(-0.18, -0.28, 0.36, -0.2, 0.58, 0);
      ctx.bezierCurveTo(0.36, 0.22, -0.18, 0.28, -0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(-0.5, 0);
      ctx.lineTo(-0.9, -0.28);
      ctx.lineTo(-0.82, 0);
      ctx.lineTo(-0.9, 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-1.4, 0);
    ctx.bezierCurveTo(-1.1, -0.8, 0.2, -0.95, 1.15, -0.25);
    ctx.bezierCurveTo(1.6, 0.05, 1.6, 0.4, 1.1, 0.66);
    ctx.bezierCurveTo(0.2, 1.05, -1.1, 0.86, -1.4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(-1.25, 0);
    ctx.lineTo(-2.02, -0.82);
    ctx.lineTo(-1.82, 0);
    ctx.lineTo(-2.02, 0.82);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(-0.15, 0.1);
    ctx.bezierCurveTo(0.35, -0.05, 0.82, 0.05, 1.05, 0.3);
    ctx.bezierCurveTo(0.7, 0.62, 0.15, 0.7, -0.2, 0.48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#bfdbfe';
    ctx.beginPath();
    ctx.moveTo(-0.18, -0.22);
    ctx.lineTo(0.25, -1.02);
    ctx.lineTo(0.72, -0.26);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0.15, 0.2);
    ctx.lineTo(0.72, 0.56);
    ctx.lineTo(0.08, 0.58);
    ctx.closePath();
    ctx.fill();

    this.drawEye(ctx, 0.84, -0.08, 1.05);
    this.drawSmile(ctx, 0.7, 0.18, 0.16);

    ctx.fillStyle = theme.winnerText;
    ctx.globalAlpha *= 0.18;
    ctx.beginPath();
    ctx.arc(0.78, -0.05, 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.18;
  }

  private drawStarfish(ctx: CanvasRenderingContext2D, rate: number, theme: ColorTheme, bodyColor: string) {
    ctx.save();
    ctx.rotate(rate * Math.PI * 2.2);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
      const innerAngle = outerAngle + Math.PI / 5;
      const outerRadius = 1.18;
      const innerRadius = 0.46;
      if (i === 0) {
        ctx.moveTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
      } else {
        ctx.lineTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
      }
      ctx.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
    ctx.beginPath();
    ctx.arc(0, -0.05, 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.drawEye(ctx, -0.18, -0.08, 0.86);
    this.drawEye(ctx, 0.22, -0.02, 0.86);
    this.drawSmile(ctx, 0.02, 0.18, 0.14);

    ctx.fillStyle = theme.winnerText;
    ctx.globalAlpha *= 0.12;
    for (let i = 0; i < 5; i++) {
      const dotAngle = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
      ctx.beginPath();
      ctx.arc(Math.cos(dotAngle) * 0.56, Math.sin(dotAngle) * 0.56, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha /= 0.12;
  }

  private drawOctopus(
    ctx: CanvasRenderingContext2D,
    rate: number,
    theme: ColorTheme,
    bodyColor: string,
    tentacleCount: number,
    tentacleScale: number
  ) {
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0.15, -0.12, 1.05, 0.92, 0, Math.PI, 0, true);
    ctx.lineTo(1.08, 0.32);
    ctx.quadraticCurveTo(0.35, 1.05, -0.78, 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 0.12;
    for (let i = 0; i < tentacleCount; i++) {
      const ratio = tentacleCount === 1 ? 0.5 : i / (tentacleCount - 1);
      const x = -0.62 + ratio * 1.3;
      const sway = Math.sin(rate * Math.PI * 3 + i * 0.8) * 0.24;
      ctx.beginPath();
      ctx.moveTo(x, 0.5);
      ctx.bezierCurveTo(x - 0.15, 0.82, x + sway, 1.02, x - sway * 0.4, 1.26 * tentacleScale);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath();
    ctx.ellipse(0.08, -0.18, 0.46, 0.24, -0.2, 0, Math.PI * 2);
    ctx.fill();

    this.drawEye(ctx, -0.18, -0.05, 0.98);
    this.drawEye(ctx, 0.28, -0.02, 0.98);
    this.drawSmile(ctx, 0.1, 0.2, 0.16);

    ctx.fillStyle = theme.winnerText;
    ctx.globalAlpha *= 0.16;
    ctx.beginPath();
    ctx.arc(0.12, 0.08, 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.16;
  }

  private drawFish(
    ctx: CanvasRenderingContext2D,
    theme: ColorTheme,
    bodyColor: string,
    tailColor: string,
    longBody: boolean
  ) {
    const bodyLength = longBody ? 2.35 : 1.8;
    const bodyHeight = longBody ? 0.34 : 0.62;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.55, 0);
    ctx.bezierCurveTo(-bodyLength * 0.18, -bodyHeight, bodyLength * 0.28, -bodyHeight * 0.9, bodyLength * 0.55, -0.08);
    ctx.bezierCurveTo(bodyLength * 0.7, 0.02, bodyLength * 0.72, 0.2, bodyLength * 0.52, 0.32);
    ctx.bezierCurveTo(bodyLength * 0.16, bodyHeight, -bodyLength * 0.16, bodyHeight * 0.96, -bodyLength * 0.55, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tailColor;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.52, 0);
    ctx.lineTo(-bodyLength * 0.98, -bodyHeight * 0.95);
    ctx.lineTo(-bodyLength * 0.82, 0);
    ctx.lineTo(-bodyLength * 0.98, bodyHeight * 0.95);
    ctx.closePath();
    ctx.fill();

    if (longBody) {
      ctx.strokeStyle = 'rgba(255,255,255,0.88)';
      ctx.lineWidth = 0.08;
      ctx.beginPath();
      ctx.moveTo(-0.1, -0.04);
      ctx.lineTo(0.92, -0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.1, 0.14);
      ctx.lineTo(0.82, 0.04);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.38)';
      ctx.lineWidth = 0.08;
      for (let i = 0; i < 4; i++) {
        const x = -0.22 + i * 0.34;
        ctx.beginPath();
        ctx.moveTo(x, -0.34);
        ctx.lineTo(x + 0.18, 0.34);
        ctx.stroke();
      }
    }

    this.drawEye(ctx, bodyLength * 0.36, -0.04, longBody ? 0.86 : 1);
    this.drawSmile(ctx, bodyLength * 0.24, 0.12, 0.12);

    ctx.fillStyle = theme.winnerText;
    ctx.globalAlpha *= 0.14;
    ctx.beginPath();
    ctx.arc(bodyLength * 0.18, 0.02, longBody ? 0.18 : 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.14;
  }
}
