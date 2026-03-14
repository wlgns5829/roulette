import type { VectorLike } from './types/VectorLike';
import { Vector } from './utils/Vector';

type ParticleOptions = {
  angle?: number;
  speed?: number;
  size?: number;
  lifetime?: number;
  color?: string;
};

export class Particle {
  private _elapsed: number = 0;
  private _lifetime: number;
  private _size: number;
  position: VectorLike = { x: 0, y: 0 };
  force: VectorLike = { x: 0, y: 0 };
  color: string = '';
  isDestroy: boolean = false;

  constructor(x: number, y: number, options: ParticleOptions = {}) {
    this.position.x = x;
    this.position.y = y;

    const speed = options.speed ?? 120 + Math.random() * 120;
    const angle = options.angle ?? Math.random() * Math.PI * 2;
    const fx = Math.cos(angle) * speed;
    const fy = Math.sin(angle) * speed;
    this._lifetime = options.lifetime ?? 2200 + Math.random() * 700;
    this._size = options.size ?? 7 + Math.random() * 8;
    this.color = options.color ?? `hsl(${Math.random() * 360} 90% 62%)`;
    this.force = { x: fx, y: fy };
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime;
    const delta = Vector.mul(this.force, deltaTime / 100);
    this.position = Vector.add(this.position, delta);
    this.force = Vector.mul(this.force, 0.985);
    this.force.y += (8 * deltaTime) / 100;
    if (this._elapsed > this._lifetime) {
      this.isDestroy = true;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const lifeRate = this._elapsed / this._lifetime;
    const alpha = Math.max(0, 1 - lifeRate ** 1.45);
    const radius = this._size * (1 - lifeRate * 0.38);
    const trailX = this.position.x - this.force.x * 0.14;
    const trailY = this.position.y - this.force.y * 0.14;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1.4, radius * 0.42);
    ctx.shadowBlur = radius * 2.6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(this.position.x, this.position.y);
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, Math.max(1.8, radius * 0.52), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
