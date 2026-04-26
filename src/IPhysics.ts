import type { StageDef } from './data/maps';
import type { MapEntityState } from './types/MapEntity.type';
import type { VectorLike } from './types/VectorLike';

export interface IPhysics {
  init(): Promise<void>;

  clear(): void;

  clearMarbles(): void;

  createStage(stage: StageDef): void;

  createMarble(id: number, x: number, y: number): void;

  shakeMarble(id: number): void;

  nudgeMarble(id: number, impulse: VectorLike): void;

  removeMarble(id: number): void;

  getMarblePosition(id: number): { x: number; y: number; angle: number };

  getEntities(): MapEntityState[];

  consumeDestroyedEntities(): MapEntityState[];

  impact(id: number): void;

  setGravity(gravity: VectorLike): void;

  start(): void;

  step(deltaSeconds: number): void;
}
