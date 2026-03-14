import { Particle } from './particle';

type ShotOptions = {
  count?: number;
  palette?: string[];
  sizeRange?: [number, number];
  speedRange?: [number, number];
  lifeRange?: [number, number];
};

export class ParticleManager {
  private _particles: Particle[] = [];

  update(deltaTime: number) {
    this._particles.forEach((particle) => {
      particle.update(deltaTime);
    });
    this._particles = this._particles.filter((particle) => !particle.isDestroy);
  }

  render(ctx: CanvasRenderingContext2D) {
    this._particles.forEach((particle) => particle.render(ctx));
  }

  shot(x: number, y: number, options: ShotOptions = {}) {
    const {
      count = 120,
      palette = ['#f59e0b', '#fbbf24', '#ffffff', '#fb7185'],
      sizeRange = [5, 14],
      speedRange = [80, 220],
      lifeRange = [1500, 2600],
    } = options;

    for (let i = 0; i < count; i++) {
      const progress = i / Math.max(count, 1);
      const baseAngle = progress * Math.PI * 2;
      const angle = baseAngle + (Math.random() - 0.5) * 0.24;
      const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
      const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      const lifetime = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
      const color = palette[Math.floor(Math.random() * palette.length)];
      this._particles.push(new Particle(x, y, { angle, speed, size, lifetime, color }));
    }
  }
}
