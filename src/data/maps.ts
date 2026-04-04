import type { EntityMotion, MapEntity } from '../types/MapEntity.type';
import type { LunchEventId } from '../types/RoundEvent.type';
import { curatedLunchStages } from './lunchMaps';
import { getStageBackdrop, type StageBackdropId } from './stageBackdrops';

export type StagePresentation = 'default' | 'side-scroll';

export type StageDef = {
  title: string;
  description?: string;
  flavor?: string;
  accent?: string;
  backdrop?: StageBackdropId;
  presentation?: StagePresentation;
  eventPool?: LunchEventId[];
  entities?: MapEntity[];
  goalY: number;
  zoomY: number;
  finishMargin?: number;
};

type Point = [number, number];
type CoursePalette = {
  primary: string;
  secondary: string;
  tertiary: string;
  rail: string;
};

const trackCenterX = 13;
const trackWidth = 26;
const finishRunwayLength = 22;
const trackOuterLeft = 2.2;
const wallProfileCatalog: number[][] = [
  [2.4, 2.4, 5.1, 7.3, 5.2, 6.8, 8.1, 6.5],
  [3.1, 3.1, 4.6, 6.4, 7.7, 5.8, 4.4, 6.6],
  [2.5, 2.5, 3.9, 6.8, 8.3, 6.5, 4.8, 7.1],
  [2.8, 2.8, 6.1, 7.4, 5.4, 3.8, 5.8, 7.2],
  [2.6, 2.6, 5.8, 7.1, 5.1, 7.2, 4.5, 6.9],
];
const wallProfileStops = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84] as const;
const railPalette = ['#fff8ef', '#ecfeff', '#fff1dc', '#f5f3ff', '#fef3c7'];
const supportPalette = ['#38bdf8', '#fbbf24', '#fb7185', '#22c55e', '#a78bfa'];

function cloneEntity(entity: MapEntity): MapEntity {
  const cloned = {
    ...entity,
    position: { ...entity.position },
    props: { ...entity.props },
    motion: entity.motion ? { ...entity.motion } : undefined,
    shape:
      entity.shape.type === 'polyline'
        ? {
            ...entity.shape,
            points: entity.shape.points.map(([x, y]) => [x, y]),
          }
        : { ...entity.shape },
  };

  if (cloned.shape.type === 'circle') {
    cloned.props.life = 1;
  }

  return cloned;
}

function createGuideWall(points: [number, number][], color: string): MapEntity {
  return {
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      points,
      color,
      bloomColor: color,
    },
    props: { density: 1, angularVelocity: 0, restitution: 0 },
  };
}

function mirrorX(x: number) {
  return trackWidth - x;
}

function createMotion(axis: 'x' | 'y', amplitude: number, speed: number, phase = 0): EntityMotion {
  return { axis, amplitude, speed, phase };
}

function createBoxObstacle(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  color: string,
  {
    type = 'static',
    restitution = 0,
    motion,
    angularVelocity = 0,
    life,
  }: {
    type?: 'static' | 'kinematic';
    restitution?: number;
    motion?: EntityMotion;
    angularVelocity?: number;
    life?: number;
  } = {}
): MapEntity {
  return {
    position: { x, y },
    type: motion ? 'kinematic' : type,
    shape: { type: 'box', width, height, rotation, color, bloomColor: color },
    props: { density: 1, angularVelocity, restitution, life },
    motion,
  };
}

function createSpinner(x: number, y: number, width: number, angularVelocity: number, color: string) {
  return createBoxObstacle(x, y, width, 0.12, 0, color, { type: 'kinematic', angularVelocity });
}

function createFragileCircle(x: number, y: number, radius: number, color: string, restitution = 1.28): MapEntity {
  return {
    position: { x, y },
    type: 'static',
    shape: { type: 'circle', radius, color, bloomColor: color },
    props: { density: 1, angularVelocity: 0, restitution, life: 1 },
  };
}

function getCoursePalette(accent: string | undefined, index: number): CoursePalette {
  return {
    primary: accent ?? supportPalette[index % supportPalette.length],
    secondary: supportPalette[(index + 2) % supportPalette.length],
    tertiary: railPalette[(index + 1) % railPalette.length],
    rail: railPalette[index % railPalette.length],
  };
}

function createBoundaryWalls(goalY: number, pattern: number, color: string): MapEntity[] {
  const profile = wallProfileCatalog[pattern % wallProfileCatalog.length];
  const usableHeight = Math.max(82, goalY - 46);
  const leftPoints: Point[] = [
    [trackOuterLeft, -260],
    [trackOuterLeft, 18],
    ...profile.map((x, i) => [x, 18 + usableHeight * wallProfileStops[i]] as Point),
    [trackCenterX - 4.2, goalY - 25.5],
  ];
  const rightPoints: Point[] = leftPoints.map(([x, y]) => [mirrorX(x), y]);

  return [createGuideWall(leftPoints, color), createGuideWall(rightPoints, color)];
}

function createTiltPair(y: number, colorA: string, colorB: string, flip = false): MapEntity[] {
  const dir = flip ? -1 : 1;
  return [
    createBoxObstacle(8.15, y, 1.95, 0.11, 0.58 * dir, colorA),
    createBoxObstacle(17.85, y + 2.35, 1.78, 0.11, -0.54 * dir, colorB),
    createBoxObstacle(trackCenterX, y + 5.15, 1.36, 0.11, 0.2 * dir, colorA),
  ];
}

function createSwingGatePair(y: number, colorA: string, colorB: string, phase = 0): MapEntity[] {
  return [
    createBoxObstacle(8.8, y, 1.72, 0.11, 0.08, colorA, {
      motion: createMotion('x', 1.28, 1.18, phase),
    }),
    createBoxObstacle(17.2, y + 2.25, 1.72, 0.11, -0.08, colorB, {
      motion: createMotion('x', 1.16, 1.28, phase + 1.2),
    }),
  ];
}

function createSpinnerPair(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createSpinner(9.2, y, 2.7, 4.7, colorA),
    createSpinner(16.8, y + 2.5, 2.25, -4.35, colorB),
  ];
}

function createCenterSpinner(y: number, color: string, width = 4.4, angularVelocity = -4.9): MapEntity[] {
  return [createSpinner(trackCenterX, y, width, angularVelocity, color)];
}

function createPocketWalls(y: number, color: string): MapEntity[] {
  return [
    createGuideWall(
      [
        [4.2, y],
        [8.3, y + 5.1],
        [7.1, y + 10.2],
      ],
      color
    ),
    createGuideWall(
      [
        [21.8, y],
        [17.7, y + 5.1],
        [18.9, y + 10.2],
      ],
      color
    ),
  ];
}

function createSplitMergeWalls(y: number, color: string): MapEntity[] {
  return [
    createGuideWall(
      [
        [5.2, y],
        [9.8, y + 4.2],
        [7.5, y + 10.8],
      ],
      color
    ),
    createGuideWall(
      [
        [20.8, y],
        [16.2, y + 4.2],
        [18.5, y + 10.8],
      ],
      color
    ),
    createGuideWall(
      [
        [9.5, y + 12.1],
        [11.6, y + 16.9],
      ],
      color
    ),
    createGuideWall(
      [
        [16.5, y + 12.1],
        [14.4, y + 16.9],
      ],
      color
    ),
  ];
}

function createBridgeRails(y: number, color: string): MapEntity[] {
  return [
    createGuideWall(
      [
        [7.1, y],
        [10.3, y + 5.4],
        [10.6, y + 12.3],
      ],
      color
    ),
    createGuideWall(
      [
        [18.9, y],
        [15.7, y + 5.4],
        [15.4, y + 12.3],
      ],
      color
    ),
  ];
}

function createFragileCluster(y: number, colorA: string, colorB: string): MapEntity[] {
  const dots: Array<[number, number, number, string]> = [
    [8.5, y, 0.29, colorA],
    [11, y + 1.7, 0.26, colorB],
    [14.9, y + 0.9, 0.28, colorA],
    [17.4, y + 1.9, 0.26, colorB],
    [10, y + 4.8, 0.27, colorB],
    [13, y + 5.7, 0.31, colorA],
    [16, y + 4.8, 0.27, colorB],
  ];

  return dots.map(([x, dotY, radius, color]) => createFragileCircle(x, dotY, radius, color));
}

function createFragileStair(y: number, colorA: string, colorB: string): MapEntity[] {
  const dots: Array<[number, number, string]> = [
    [8.9, y, colorA],
    [12.1, y + 1.5, colorB],
    [16.1, y + 0.4, colorA],
    [10.4, y + 4.8, colorB],
    [13.7, y + 5.9, colorA],
    [16.9, y + 7, colorB],
    [13, y + 9.5, colorA],
  ];

  return dots.map(([x, dotY, color], index) => createFragileCircle(x, dotY, 0.26 + (index % 3) * 0.02, color));
}

function createCrissCrossGates(y: number, colorA: string, colorB: string, colorC: string, phase = 0): MapEntity[] {
  return [
    createBoxObstacle(7.2, y, 1.5, 0.11, 0.62, colorA, {
      motion: createMotion('x', 1.08, 1.26, phase),
    }),
    createBoxObstacle(18.8, y + 2.1, 1.5, 0.11, -0.62, colorB, {
      motion: createMotion('x', 1.08, 1.34, phase + 0.85),
    }),
    createBoxObstacle(10.1, y + 4.2, 1.35, 0.11, -0.54, colorC, {
      motion: createMotion('x', 0.95, 1.42, phase + 1.5),
    }),
    createBoxObstacle(15.9, y + 6.1, 1.35, 0.11, 0.54, colorA, {
      motion: createMotion('x', 0.95, 1.5, phase + 2.15),
    }),
  ];
}

function createMazeWalls(y: number, color: string): MapEntity[] {
  return [
    createGuideWall(
      [
        [4.1, y],
        [9.4, y + 3.9],
        [7.2, y + 8.5],
        [10.8, y + 13.2],
      ],
      color
    ),
    createGuideWall(
      [
        [21.9, y],
        [16.6, y + 3.9],
        [18.8, y + 8.5],
        [15.2, y + 13.2],
      ],
      color
    ),
    createGuideWall(
      [
        [10.7, y + 14.4],
        [8.9, y + 18.4],
      ],
      color
    ),
    createGuideWall(
      [
        [15.3, y + 14.4],
        [17.1, y + 18.4],
      ],
      color
    ),
  ];
}

function createSpinnerCorridor(y: number, colorA: string, colorB: string, colorC: string): MapEntity[] {
  return [
    createSpinner(7.9, y, 2.05, 4.2, colorA),
    createSpinner(trackCenterX, y + 2.7, 4.9, -4.9, colorB),
    createSpinner(18.1, y + 5.4, 2.05, 4.2, colorC),
  ];
}

function createFragileRing(y: number, colorA: string, colorB: string): MapEntity[] {
  const ring: Array<[number, number, number, string]> = [
    [9.2, y, 0.27, colorA],
    [11.4, y - 1.1, 0.24, colorB],
    [14.6, y - 1.1, 0.24, colorB],
    [16.8, y, 0.27, colorA],
    [9.9, y + 2.7, 0.25, colorB],
    [13, y + 4.1, 0.33, colorA],
    [16.1, y + 2.7, 0.25, colorB],
  ];

  return ring.map(([x, dotY, radius, color]) => createFragileCircle(x, dotY, radius, color));
}

function createDenseTiltStack(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    ...createTiltPair(y, colorA, colorB, false),
    createBoxObstacle(9.4, y + 7.2, 1.55, 0.11, -0.46, colorB),
    createBoxObstacle(16.6, y + 8.4, 1.55, 0.11, 0.46, colorA),
  ];
}

function createSidePlatform(x: number, y: number, length: number, color: string, motion?: EntityMotion): MapEntity {
  return createBoxObstacle(x, y, 0.11, length, 0, color, { motion });
}

function createJumpRamp(x: number, y: number, length: number, color: string, flip = false): MapEntity {
  return createBoxObstacle(x, y, 0.12, length, flip ? -0.72 : 0.72, color, { restitution: 0.08 });
}

function createJumpPads(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createFragileCircle(7.6, y, 0.34, colorA, 1.58),
    createFragileCircle(10.8, y + 1.1, 0.3, colorB, 1.52),
    createFragileCircle(15.4, y + 0.3, 0.33, colorA, 1.6),
    createFragileCircle(18.6, y + 1.3, 0.3, colorB, 1.54),
  ];
}

function createPipeColumns(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createBoxObstacle(7.5, y, 1.2, 0.12, 0, colorA),
    createBoxObstacle(18.6, y + 2.1, 1.35, 0.12, 0, colorB),
    createBoxObstacle(12.7, y + 5.4, 0.78, 0.1, 0, colorA),
  ];
}

function createCloudPlatforms(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createSidePlatform(18.1, y, 1.3, colorA),
    createSidePlatform(14.6, y + 3.2, 1.15, colorB),
    createSidePlatform(9.2, y + 6.4, 1.35, colorA),
  ];
}

function createPlatformStairs(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createSidePlatform(8.1, y, 0.92, colorA),
    createSidePlatform(10.3, y + 2.4, 0.92, colorB),
    createSidePlatform(12.9, y + 4.8, 0.92, colorA),
    createSidePlatform(15.5, y + 7.2, 0.92, colorB),
  ];
}

function createBounceBridge(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createJumpRamp(17.6, y, 1.15, colorA, false),
    createSidePlatform(14.2, y + 3.1, 1.08, colorB),
    createJumpRamp(9.4, y + 6.5, 1.15, colorA, true),
    createSidePlatform(12.6, y + 9.7, 1, colorB),
  ];
}

function createPlatformTunnel(y: number, colorA: string, colorB: string): MapEntity[] {
  return [
    createSidePlatform(19.2, y, 1.55, colorA),
    createSidePlatform(6.8, y + 2.1, 1.55, colorA),
    createBoxObstacle(13, y + 4.5, 0.95, 0.11, 0, colorB),
    createSidePlatform(18.1, y + 7, 1.2, colorB),
    createSidePlatform(7.9, y + 9.1, 1.2, colorB),
  ];
}

function createMovingPlatformSet(y: number, colorA: string, colorB: string, phase = 0): MapEntity[] {
  return [
    createSidePlatform(17.4, y, 1.22, colorA, createMotion('x', 1.15, 1.2, phase)),
    createSidePlatform(8.6, y + 3.1, 1.14, colorB, createMotion('x', 1.02, 1.32, phase + 1.2)),
    createSidePlatform(13, y + 6.8, 1.08, colorA, createMotion('x', 0.7, 1.44, phase + 2.1)),
  ];
}

function buildSideScrollEntities(stage: StageDef, index: number): MapEntity[] {
  const palette = getCoursePalette(stage.accent, index);
  const usableHeight = Math.max(80, stage.goalY - 56);
  const bandYs = [0.08, 0.2, 0.33, 0.46, 0.59, 0.71].map((t) => 24 + usableHeight * t);
  const phase = (index % 4) * 0.6;
  const entities: MapEntity[] = [...createBoundaryWalls(stage.goalY, index, palette.rail)];

  switch (index % 4) {
    case 0:
      entities.push(...createPlatformStairs(bandYs[0], palette.primary, palette.secondary));
      entities.push(...createJumpPads(bandYs[1], palette.primary, palette.tertiary));
      entities.push(...createCloudPlatforms(bandYs[2], palette.tertiary, palette.secondary));
      entities.push(...createPipeColumns(bandYs[3], palette.primary, palette.secondary));
      entities.push(...createBounceBridge(bandYs[4], palette.secondary, palette.tertiary));
      entities.push(...createMovingPlatformSet(bandYs[5], palette.primary, palette.secondary, phase));
      break;
    case 1:
      entities.push(...createBounceBridge(bandYs[0], palette.primary, palette.secondary));
      entities.push(...createPlatformTunnel(bandYs[1], palette.tertiary, palette.secondary));
      entities.push(...createJumpPads(bandYs[2], palette.primary, palette.tertiary));
      entities.push(...createCloudPlatforms(bandYs[3], palette.secondary, palette.primary));
      entities.push(...createPlatformStairs(bandYs[4], palette.tertiary, palette.secondary));
      entities.push(...createMovingPlatformSet(bandYs[5], palette.primary, palette.tertiary, phase + 0.35));
      break;
    case 2:
      entities.push(...createCloudPlatforms(bandYs[0], palette.primary, palette.secondary));
      entities.push(...createJumpPads(bandYs[1], palette.secondary, palette.tertiary));
      entities.push(...createPipeColumns(bandYs[2], palette.primary, palette.secondary));
      entities.push(...createPlatformTunnel(bandYs[3], palette.tertiary, palette.primary));
      entities.push(...createBounceBridge(bandYs[4], palette.primary, palette.secondary));
      entities.push(...createMovingPlatformSet(bandYs[5], palette.secondary, palette.tertiary, phase + 0.7));
      break;
    case 3:
    default:
      entities.push(...createPlatformTunnel(bandYs[0], palette.primary, palette.secondary));
      entities.push(...createPlatformStairs(bandYs[1], palette.secondary, palette.tertiary));
      entities.push(...createJumpPads(bandYs[2], palette.primary, palette.secondary));
      entities.push(...createCloudPlatforms(bandYs[3], palette.tertiary, palette.primary));
      entities.push(...createPipeColumns(bandYs[4], palette.secondary, palette.primary));
      entities.push(...createMovingPlatformSet(bandYs[5], palette.primary, palette.tertiary, phase + 0.5));
      break;
  }

  return entities;
}

function buildSpectacleEntities(stage: StageDef, index: number): MapEntity[] {
  if (stage.presentation === 'side-scroll') {
    return buildSideScrollEntities(stage, index);
  }

  const pattern = index % 5;
  const palette = getCoursePalette(stage.accent, index);
  const usableHeight = Math.max(78, stage.goalY - 54);
  const bandYs = [0.06, 0.17, 0.29, 0.41, 0.53, 0.65, 0.77].map((t) => 24 + usableHeight * t);
  const phase = (index % 4) * 0.55;
  const entities: MapEntity[] = [...createBoundaryWalls(stage.goalY, pattern, palette.rail)];

  switch (pattern) {
    case 0:
      entities.push(...createPocketWalls(bandYs[0] - 2.8, palette.rail));
      entities.push(...createDenseTiltStack(bandYs[0], palette.primary, palette.secondary));
      entities.push(...createCrissCrossGates(bandYs[1], palette.primary, palette.secondary, palette.tertiary, phase));
      entities.push(...createSpinnerCorridor(bandYs[2], palette.secondary, palette.primary, palette.tertiary));
      entities.push(...createFragileCluster(bandYs[3], palette.secondary, palette.tertiary));
      entities.push(...createSwingGatePair(bandYs[4], palette.tertiary, palette.primary, phase + 0.8));
      entities.push(...createFragileRing(bandYs[5], palette.primary, palette.tertiary));
      entities.push(...createCenterSpinner(bandYs[6], palette.secondary, 4.8, -4.8));
      break;
    case 1:
      entities.push(...createSplitMergeWalls(bandYs[0] - 4.8, palette.rail));
      entities.push(...createCenterSpinner(bandYs[1], palette.primary, 4.8, index % 2 === 0 ? -5 : 5));
      entities.push(...createCrissCrossGates(bandYs[2], palette.secondary, palette.primary, palette.tertiary, phase + 0.3));
      entities.push(...createFragileStair(bandYs[3], palette.secondary, palette.tertiary));
      entities.push(...createMazeWalls(bandYs[4] - 2.1, palette.secondary));
      entities.push(...createTiltPair(bandYs[5], palette.primary, palette.secondary, true));
      entities.push(...createSwingGatePair(bandYs[6], palette.tertiary, palette.primary, phase + 0.95));
      break;
    case 2:
      entities.push(...createBridgeRails(bandYs[0] - 4.1, palette.rail));
      entities.push(...createSpinnerPair(bandYs[1], palette.primary, palette.secondary));
      entities.push(...createPocketWalls(bandYs[2] - 2.8, palette.secondary));
      entities.push(...createFragileCluster(bandYs[2] + 6.2, palette.tertiary, palette.primary));
      entities.push(...createCrissCrossGates(bandYs[3], palette.secondary, palette.primary, palette.tertiary, phase + 0.5));
      entities.push(...createMazeWalls(bandYs[4] - 2.3, palette.rail));
      entities.push(...createCenterSpinner(bandYs[5], palette.primary, 5.1, -4.7));
      entities.push(...createFragileRing(bandYs[6], palette.secondary, palette.tertiary));
      break;
    case 3:
      entities.push(...createDenseTiltStack(bandYs[0], palette.primary, palette.secondary));
      entities.push(...createFragileStair(bandYs[1], palette.tertiary, palette.primary));
      entities.push(...createCenterSpinner(bandYs[2], palette.secondary, 5.2, 5));
      entities.push(...createMazeWalls(bandYs[3] - 1.8, palette.tertiary));
      entities.push(...createSwingGatePair(bandYs[4], palette.primary, palette.tertiary, phase + 0.2));
      entities.push(...createSpinnerPair(bandYs[5], palette.secondary, palette.primary));
      entities.push(...createFragileCluster(bandYs[6], palette.primary, palette.secondary));
      break;
    case 4:
    default:
      entities.push(...createBridgeRails(bandYs[0] - 3.8, palette.rail));
      entities.push(...createSwingGatePair(bandYs[1], palette.primary, palette.secondary, phase + 0.1));
      entities.push(...createPocketWalls(bandYs[2] - 3.4, palette.rail));
      entities.push(...createFragileCluster(bandYs[2] + 5.8, palette.secondary, palette.tertiary));
      entities.push(...createCrissCrossGates(bandYs[3], palette.primary, palette.secondary, palette.tertiary, phase + 0.55));
      entities.push(...createSpinnerPair(bandYs[4], palette.primary, palette.secondary));
      entities.push(...createFragileRing(bandYs[5], palette.secondary, palette.tertiary));
      entities.push(...createTiltPair(bandYs[6], palette.secondary, palette.primary, index % 2 === 0));
      break;
  }

  return entities;
}

function getForwardExtent(entity: MapEntity) {
  switch (entity.shape.type) {
    case 'box':
      return entity.position.y + entity.shape.height + 0.6;
    case 'circle':
      return entity.position.y + entity.shape.radius + 0.45;
    case 'polyline':
    default:
      return entity.position.y;
  }
}

function isLateStageObstacle(entity: MapEntity, runwayStartY: number) {
  if (entity.shape.type === 'polyline') {
    return false;
  }

  return getForwardExtent(entity) >= runwayStartY;
}

function interpolatePointAtY(a: [number, number], b: [number, number], y: number): [number, number] {
  if (Math.abs(b[1] - a[1]) < 0.0001) {
    return [b[0], y];
  }

  const ratio = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * ratio, y];
}

function trimPolylinePoints(points: [number, number][], maxY: number): [number, number][] | null {
  if (points.length < 2) {
    return null;
  }

  const trimmed: [number, number][] = [];
  const pushPoint = ([x, y]: [number, number]) => {
    const last = trimmed[trimmed.length - 1];
    if (!last || Math.abs(last[0] - x) > 0.001 || Math.abs(last[1] - y) > 0.001) {
      trimmed.push([x, y]);
    }
  };

  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index];
    const end = points[index + 1];
    const startInside = start[1] <= maxY;
    const endInside = end[1] <= maxY;

    if (startInside) {
      pushPoint(start);
    }

    if (startInside !== endInside) {
      pushPoint(interpolatePointAtY(start, end, maxY));
    }
  }

  const last = points[points.length - 1];
  if (last[1] <= maxY) {
    pushPoint(last);
  }

  return trimmed.length >= 2 ? trimmed : null;
}

function trimFinishPolyline(entity: MapEntity, runwayStartY: number): MapEntity | null {
  if (entity.shape.type !== 'polyline') {
    return entity;
  }

  const trimmedPoints = trimPolylinePoints(entity.shape.points, runwayStartY);
  if (!trimmedPoints) {
    return null;
  }

  return {
    ...entity,
    shape: {
      ...entity.shape,
      points: trimmedPoints,
    },
  };
}

function createFinishGuide(stage: StageDef, color: string, runwayStartY: number): MapEntity[] {
  const goalY = stage.goalY;
  const funnelY = goalY - 10.8;
  const chuteY = goalY - 4.6;
  const leftOuterStart = 3.4;
  const rightOuterStart = 22.6;
  const leftChute = trackCenterX - 1.95;
  const rightChute = trackCenterX + 1.95;

  return [
    createGuideWall(
      [
        [leftOuterStart, runwayStartY],
        [4.9, runwayStartY + 4.4],
        [6.9, runwayStartY + 9.2],
        [8.9, funnelY],
        [10.2, chuteY],
        [leftChute, goalY + 3.4],
      ],
      color
    ),
    createGuideWall(
      [
        [rightOuterStart, runwayStartY],
        [21.1, runwayStartY + 4.4],
        [19.1, runwayStartY + 9.2],
        [17.1, funnelY],
        [15.8, chuteY],
        [rightChute, goalY + 3.4],
      ],
      color
    ),
  ];
}

function sanitizeStage(stage: StageDef): StageDef {
  const finishMargin = stage.finishMargin ?? 2.3;
  const goalGuideColor = stage.accent ?? '#fff8ef';
  const runwayStartY = stage.goalY - finishRunwayLength;
  const entities = (stage.entities ?? [])
    .map(cloneEntity)
    .map((entity) => trimFinishPolyline(entity, runwayStartY))
    .filter((entity): entity is MapEntity => Boolean(entity))
    .filter((entity) => !isLateStageObstacle(entity, runwayStartY - 0.8));

  entities.push(...createFinishGuide(stage, goalGuideColor, runwayStartY));

  return {
    ...stage,
    finishMargin,
    entities,
  };
}

const baseStages: StageDef[] = [
  {
    title: 'Wheel of fortune',
    goalY: 111,
    zoomY: 106.75,
    entities: [
      // polyline
      {
        position: { x: 0, y: 0 },
        shape: {
          type: 'polyline',
          points: [
            [16.5, -300],
            [9.25, -300],
            [9.25, 8.5],
            [2, 19.25],
            [2, 26],
            [9.75, 30],
            [9.75, 33.5],
            [1.25, 41],
            [1.25, 53.75],
            [8.25, 58.75],
            [8.25, 63],
            [9.25, 64],
            [8.25, 65],
            [8.25, 99.25],
            [15.1, 106.75],
            [15.1, 111.75],
          ],
          rotation: 0,
        },
        type: 'static',
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [16.5, -300],
            [16.5, 9.25],
            [9.5, 20],
            [9.5, 22.5],
            [17.5, 26],
            [17.5, 33.5],
            [24, 38.5],
            [19, 45.5],
            [19, 55.5],
            [24, 59.25],
            [24, 63],
            [23, 64],
            [24, 65],
            [24, 100.5],
            [16, 106.75],
            [16, 111.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [12.75, 37.5],
            [7, 43.5],
            [7, 49.75],
            [12.75, 53.75],
            [12.75, 37.5],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [14.75, 37.5],
            [14.75, 43],
            [17.5, 40.25],
            [14.75, 37.5],
          ],
        },
      },
      // boxes
      {
        position: { x: 15.5, y: 30.0 },
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45 },
        type: 'static',
        props: { density: 1, angularVelocity: 0, restitution: 1 },
      },
      {
        position: { x: 15.5, y: 32 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 15.5, y: 28 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 12.5, y: 30 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 12.5, y: 32 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 12.5, y: 28 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.4, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 11.3, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 13.2, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 15.1, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 17, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 18.9, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 20.699999999999996, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 22.7, y: 66.6 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: 45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.4, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 11.3, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 13.2, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 15.1, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 17, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 18.9, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 20.699999999999996, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 22.7, y: 69.1 },
        type: 'static',
        shape: { type: 'box', width: 0.6, height: 0.1, rotation: -45 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.5, y: 92 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 12.75, y: 92 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 16, y: 92 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 19.25, y: 92 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 22.5, y: 92 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 11, y: 95 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 14.25, y: 95 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 17.5, y: 95 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 20.75, y: 95 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.5, y: 98 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 12.75, y: 98 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 16, y: 98 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 19.25, y: 98 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 22.5, y: 98 },
        type: 'static',
        shape: {
          type: 'box',
          width: 0.25,
          height: 0.25,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },

      // wheels
      {
        position: { x: 8, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 3.5, restitution: 0 },
      },
      {
        position: { x: 12, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -3.5, restitution: 0 },
      },
      {
        position: { x: 16, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 3.5, restitution: 0 },
      },
      {
        position: { x: 20, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -3.5, restitution: 0 },
      },
      {
        position: { x: 24, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 3.5, restitution: 0 },
      },
      {
        position: { x: 14, y: 106.75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -1.2, restitution: 0 },
      },
    ],
  },
  {
    title: 'BubblePop',
    goalY: 83,
    zoomY: 78,
    entities: [
      {
        type: 'static',
        position: { x: 10.375, y: -108.5 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [6.125, -191.5],
            [-1.125, -191.5],
            [-1.125, 108.5],
            [-1.125, 151.5],
            [-6.125, 158.5],
            [-1.125, 161.5],
            [-1.125, 179.5],
            [-0.9128679656440362, 179.7498817789222],
            [-1.125, 179.9997635578444],
            [-1.125, 183.5],
            [1.625, 188.5],
            [1.625, 191.5],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 16.25, y: -108.5 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [0.25, -191.5],
            [0.25, 158.5],
            [3.25, 162.5],
            [2.25, 164.5],
            [3.25, 166.5],
            [0.25, 169.5],
            [0.25, 179.5],
            [0.03786796564403616, 179.75925677892224],
            [0.25, 179.9997635578444],
            [0.25, 183.5],
            [-3.25, 188.5],
            [-3.25, 191.5],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 16.5, y: 55.75 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [0, -3.25],
            [1, -1.75],
            [0, 0.25],
            [1, 2.25],
            [0, 3.25],
            [-1, 0.25],
            [0, -3.25],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 10.375, y: 48.25 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [-1.125, -2.75],
            [-4.125, 1.25],
            [-1.125, 2.75],
            [4.125, 2.25],
            [-1.125, -2.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 10.15625, y: 26.75 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [-0.90625, -0.75],
            [0.90625, 0.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 15.59375, y: 26.75 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [0.90625, -0.75],
            [-0.90625, 0.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 12.875, y: 29.25 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [-1.8125, 0.75],
            [0, -0.75],
            [1.8125, 0.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 10.15625, y: 31.75 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [-0.90625, -0.75],
            [0.90625, 0.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 15.59375, y: 31.75 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [0.90625, -0.75],
            [-0.90625, 0.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 12.875, y: 34.25 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [-1.8125, 0.75],
            [0, -0.75],
            [1.8125, 0.75],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 9.25, y: 18 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 11.25, y: 18 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 13.25, y: 18 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 15.25, y: 18 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 10.5, y: 19 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 12.5, y: 19 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 14.5, y: 19 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 16.5, y: 19 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 9.25, y: 20 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 11.25, y: 20 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 13.25, y: 20 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 15.25, y: 20 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 10.5, y: 21 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 12.5, y: 21 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 14.5, y: 21 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 16.5, y: 21 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 9.25, y: 22 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 11.25, y: 22 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 13.25, y: 22 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 15.25, y: 22 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 10.5, y: 23 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 12.5, y: 23 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 14.5, y: 23 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 16.5, y: 23 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 0.15, height: 0.15 },
      },
      {
        type: 'static',
        position: { x: 9.400000000000002, y: 39 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 3, height: 3 },
      },
      {
        type: 'static',
        position: { x: 16.5, y: 43 },
        props: { angularVelocity: 0, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0.7853981633974483, width: 3, height: 3 },
      },
      {
        type: 'kinematic',
        position: { x: 10.7, y: 10 },
        props: { angularVelocity: 10, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 0.5, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 14.7, y: 10 },
        props: { angularVelocity: -10, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 0.5, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 12.7, y: 10 },
        props: { angularVelocity: 10, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 0.5, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 10.7, y: 14 },
        props: { angularVelocity: -3, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 2, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 14.7, y: 14 },
        props: { angularVelocity: 3, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 2, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 11.2, y: 44 },
        props: { angularVelocity: -5, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 0.5, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 10.3, y: 75 },
        props: { angularVelocity: 8, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 1, height: 0.1 },
      },
      {
        type: 'kinematic',
        position: { x: 15.462132034355964, y: 75 },
        props: { angularVelocity: -8, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 1, height: 0.1 },
      },
      {
        type: 'static',
        position: { x: 11, y: 65 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 13, y: 65 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 15, y: 65 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 12, y: 67.5 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 14, y: 67.5 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 13, y: 69.77058813837772 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.8 },
      },
      {
        type: 'static',
        position: { x: 10.7, y: 77.5 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.8 },
      },
      {
        type: 'static',
        position: { x: 14.7, y: 77.5 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.8 },
      },
      {
        type: 'static',
        position: { x: 12.625, y: 80 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 1.5 },
      },
      {
        type: 'static',
        position: { x: 12.625, y: 80 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 1.2 },
      },
      {
        type: 'kinematic',
        position: { x: 12.625, y: 56.00000000000001 },
        props: { angularVelocity: -8, density: 1, restitution: 0 },
        shape: { type: 'box', rotation: 0, width: 1, height: 0.1 },
      },
      {
        type: 'static',
        position: { x: 9.947604593262161, y: 62.59581680393866 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 11.947604593262161, y: 62.59581680393866 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 13.947604593262161, y: 62.59581680393866 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
      {
        type: 'static',
        position: { x: 15.828283102570442, y: 62.59581680393866 },
        props: { angularVelocity: 0, density: 1, restitution: 1.5, life: 1 },
        shape: { type: 'circle', radius: 0.5 },
      },
    ],
  },
  {
    title: 'Pot of greed',
    goalY: 111,
    zoomY: 110,
    entities: [
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [17, -300],
            [9, -300],
            [9, 8.5],
            [2, 15],
            [6, 61.5],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [7, 71],
            [9, 101],
            [8, 100.5],
            [6, 100],
            [5, 90],
            [4, 70],
            [7, 71],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [17, -300],
            [17, 8.5],
            [24, 15],
            [20, 61.5],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [19, 71],
            [17, 101],
            [18, 100.5],
            [20, 100],
            [21, 90],
            [22, 70],
            [19, 71],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [11, 88],
            [12, 90],
            [12, 112],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [15, 88],
            [14, 90],
            [14, 112],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [12, 102],
            [11, 103],
            [9, 104],
            [8, 104],
            [6, 103],
            [5, 102],
            [4, 100],
            [3, 90],
            [2, 70],
            [3, 65],
            [4, 63],
            [5, 62],
            [6, 61.5],
          ],
        },
      },
      {
        type: 'static',
        position: { x: 0, y: 0 },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'polyline',
          rotation: 0,
          points: [
            [14, 102],
            [15, 103],
            [17, 104],
            [18, 104],
            [20, 103],
            [21, 102],
            [22, 100],
            [23, 90],
            [24, 70],
            [23, 65],
            [22, 63],
            [21, 62],
            [20, 61.5],
          ],
        },
      },
      {
        position: { x: 13, y: 20 },
        type: 'static',
        shape: {
          type: 'box',
          width: 3,
          height: 3,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 13, y: 55 },
        type: 'static',
        shape: {
          type: 'box',
          width: 3,
          height: 3,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 8, y: 37 },
        type: 'static',
        shape: {
          type: 'box',
          width: 2,
          height: 2,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 18, y: 37 },
        type: 'static',
        shape: {
          type: 'box',
          width: 2,
          height: 2,
          rotation: 0.7853981633974483,
        },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 11, y: 12 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -3, restitution: 0 },
      },
      {
        position: { x: 15, y: 12 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 3, restitution: 0 },
      },
      {
        position: { x: 8, y: 104 },
        type: 'kinematic',
        shape: { type: 'box', width: 1, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 6, y: 103 },
        type: 'kinematic',
        shape: { type: 'box', width: 1.5, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 4, y: 100 },
        type: 'kinematic',
        shape: { type: 'box', width: 1.5, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 3.5, y: 95 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 3, y: 90 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 2.75, y: 85 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 2.5, y: 80 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 2.25, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 2, y: 70 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: -10, restitution: 0 },
      },
      {
        position: { x: 18, y: 104 },
        type: 'kinematic',
        shape: { type: 'box', width: 1, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 20, y: 103 },
        type: 'kinematic',
        shape: { type: 'box', width: 1.5, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 22, y: 100 },
        type: 'kinematic',
        shape: { type: 'box', width: 1.5, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 22.5, y: 95 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 23, y: 90 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 23.25, y: 85 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 23.5, y: 80 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 23.75, y: 75 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
      {
        position: { x: 24, y: 70 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0 },
        props: { density: 1, angularVelocity: 10, restitution: 0 },
      },
    ],
  },
  {
    title: 'Yoru ni Kakeru',
    goalY: 248,
    zoomY: 234.5,
    entities: [
      {
        position: { x: 2, y: 0 },
        shape: {
          type: 'box',
          width: 1,
          height: 800,
          rotation: 0,
          color: '#222',
          bloomColor: '#777',
        },
        type: 'static',
        props: { density: 500, angularVelocity: 0, restitution: 0 },
      },
      {
        type: 'static',
        position: { x: 21, y: 0 },
        props: { density: 500, angularVelocity: 0, restitution: 0 },
        shape: {
          type: 'box',
          rotation: 0,
          width: 1,
          height: 800,
          color: '#222',
          bloomColor: '#777',
        },
      },
      {
        position: { x: 4.0, y: 25.0 },
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        type: 'static',
        props: { density: 1, angularVelocity: 0, restitution: 1 },
      },
      {
        position: { x: 4.0, y: 30.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 4.0, y: 35.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 4.0, y: 40.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.0, y: 25.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.0, y: 30.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.0, y: 35.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 9.0, y: 40.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 14.0, y: 25.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 14.0, y: 30.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 14.0, y: 35.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 14.0, y: 40.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 19.0, y: 25.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 19.0, y: 30.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 19.0, y: 35.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },
      {
        position: { x: 19.0, y: 40.0 },
        type: 'static',
        shape: { type: 'box', width: 0.2, height: 0.2, rotation: -45, color: '#818fb4' },
        props: { density: 1, angularVelocity: 0, restitution: 0 },
      },

      {
        position: { x: 6.5, y: 27.5 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0, color: '#9bec00' },
        props: { density: 1, angularVelocity: 2.0, restitution: 0 },
      },
      {
        position: { x: 6.5, y: 37.5 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0, color: '#ff6868' },
        props: { density: 1, angularVelocity: 2.0, restitution: 0 },
      },
      {
        position: { x: 11.5, y: 32.5 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0, color: '#80b3ff' },
        props: { density: 2, angularVelocity: 4.0, restitution: 0 },
      },
      {
        position: { x: 16.5, y: 27.5 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0, color: '#ff6868' },
        props: { density: 1, angularVelocity: -2.0, restitution: 0 },
      },
      {
        position: { x: 16.5, y: 37.5 },
        type: 'kinematic',
        shape: { type: 'box', width: 2, height: 0.1, rotation: 0, color: '#9bec00' },
        props: { density: 1, angularVelocity: -2.0, restitution: 0 },
      },

      {
        position: { x: 10.0, y: 26.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 26.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.0, y: 26.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.0, y: 27.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 27.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.0, y: 27.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.0, y: 29.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 29.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.0, y: 29.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 5.0, y: 31.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 31.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 31.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.0, y: 32.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 32.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 32.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.0, y: 34.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 34.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 34.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 15.0, y: 31.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 31.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.0, y: 31.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.0, y: 32.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 32.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.0, y: 32.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.0, y: 34.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 34.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.0, y: 34.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 10.0, y: 36.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 36.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.0, y: 36.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.0, y: 37.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 37.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.0, y: 37.5 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.0, y: 39.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 39.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.0, y: 39.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 11.5, y: 50.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 6.5, height: 0.1, rotation: 0, color: '#5c5470' },
        props: { density: 1, angularVelocity: -2.0, restitution: 0 },
      },

      {
        position: { x: 3.5, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.0, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.0, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.0, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.0, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 20.0, y: 60.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.0, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.0, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.0, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.0, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.0, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.0, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 63.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe227' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.5, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.0, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.0, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.0, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.0, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 20.0, y: 66.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#fff4b7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 4.5, y: 75.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 4.0, height: 0.1, rotation: 0, color: '#ff577f' },
        props: { density: 1, angularVelocity: -4.0, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 75.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 4.0, height: 0.1, rotation: 0, color: '#ff577f' },
        props: { density: 1, angularVelocity: 4.0, restitution: 0 },
      },

      {
        position: { x: 3.8, y: 90.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.0, restitution: 0 },
      },
      {
        position: { x: 19.2, y: 90.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.0, restitution: 0 },
      },
      {
        position: { x: 5.8, y: 92.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.2, restitution: 0 },
      },
      {
        position: { x: 17.2, y: 92.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.2, restitution: 0 },
      },
      {
        position: { x: 7.8, y: 94.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.4, restitution: 0 },
      },
      {
        position: { x: 15.2, y: 94.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.4, restitution: 0 },
      },
      {
        position: { x: 9.8, y: 96.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 13.2, y: 96.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },

      {
        position: { x: 3.8, y: 94.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.2, restitution: 0 },
      },
      {
        position: { x: 19.2, y: 94.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.2, restitution: 0 },
      },
      {
        position: { x: 5.8, y: 96.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.4, restitution: 0 },
      },
      {
        position: { x: 17.2, y: 96.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.4, restitution: 0 },
      },
      {
        position: { x: 7.8, y: 98.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 15.2, y: 98.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 9.8, y: 100.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.8, restitution: 0 },
      },
      {
        position: { x: 13.2, y: 100.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.8, restitution: 0 },
      },

      {
        position: { x: 10.0, y: 90.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.0, y: 90.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 92.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.0, y: 92.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.0, y: 94.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.0, y: 94.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.0, y: 96.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.0, y: 96.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ffe3fe' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 10.0, y: 94.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.0, y: 94.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.0, y: 96.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.0, y: 96.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.0, y: 98.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.0, y: 98.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.0, y: 100.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.0, y: 100.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#ff94cc' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 4.5, y: 100.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 5.0, height: 0.1, rotation: 0, color: '#5c8374' },
        props: { density: 1, angularVelocity: -2.5, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 100.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 5.0, height: 0.1, rotation: 0, color: '#5c8374' },
        props: { density: 1, angularVelocity: 2.5, restitution: 0 },
      },

      {
        position: { x: 3.8, y: 104.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.4, restitution: 0 },
      },
      {
        position: { x: 19.2, y: 104.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.4, restitution: 0 },
      },
      {
        position: { x: 5.8, y: 106.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 17.2, y: 106.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 7.8, y: 108.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.8, restitution: 0 },
      },
      {
        position: { x: 15.2, y: 108.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 1.8, restitution: 0 },
      },
      {
        position: { x: 9.8, y: 110.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 2.0, restitution: 0 },
      },
      {
        position: { x: 13.2, y: 110.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#c7ffd8' },
        props: { density: 1, angularVelocity: 2.0, restitution: 0 },
      },

      {
        position: { x: 3.8, y: 108.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 19.2, y: 108.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.6, restitution: 0 },
      },
      {
        position: { x: 5.8, y: 110.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.8, restitution: 0 },
      },
      {
        position: { x: 17.2, y: 110.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 1.8, restitution: 0 },
      },
      {
        position: { x: 7.8, y: 112.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 2.0, restitution: 0 },
      },
      {
        position: { x: 15.2, y: 112.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 2.0, restitution: 0 },
      },
      {
        position: { x: 9.8, y: 114.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 2.2, restitution: 0 },
      },
      {
        position: { x: 13.2, y: 114.0 },
        type: 'static',
        shape: { type: 'box', width: 0.1, height: 0.1, rotation: -90, color: '#98ded9' },
        props: { density: 1, angularVelocity: 2.2, restitution: 0 },
      },

      {
        position: { x: 3.5, y: 105.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 105.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 3.5, y: 107.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 107.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 107.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 107.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 3.5, y: 109.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 109.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 109.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 109.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 109.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 109.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.5, color: '#edeef7' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 5.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.4, color: '#e6176d' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 5 },
      },
      {
        position: { x: 17.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.4, color: '#e6176d' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 5 },
      },
      {
        position: { x: 5.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 1.2, color: '#e64588' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 4 },
      },
      {
        position: { x: 17.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 1.2, color: '#e64588' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 4 },
      },
      {
        position: { x: 5.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 2.0, color: '#e673a3' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 3 },
      },
      {
        position: { x: 17.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 2.0, color: '#e673a3' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 3 },
      },
      {
        position: { x: 5.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 2.8, color: '#e6a1bd' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 2 },
      },
      {
        position: { x: 17.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 2.8, color: '#e6a1bd' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 2 },
      },
      {
        position: { x: 5.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 3.8, color: '#e6cfd8' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 115.0 },
        type: 'static',
        shape: { type: 'circle', radius: 3.8, color: '#e6cfd8' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 11.5, y: 120.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.4, color: '#e6176d' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 5 },
      },
      {
        position: { x: 11.5, y: 120.0 },
        type: 'static',
        shape: { type: 'circle', radius: 1.2, color: '#e64588' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 4 },
      },
      {
        position: { x: 11.5, y: 120.0 },
        type: 'static',
        shape: { type: 'circle', radius: 2.0, color: '#e673a3' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 3 },
      },
      {
        position: { x: 11.5, y: 120.0 },
        type: 'static',
        shape: { type: 'circle', radius: 2.8, color: '#e6a1bd' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 2 },
      },
      {
        position: { x: 11.5, y: 120.0 },
        type: 'static',
        shape: { type: 'circle', radius: 3.8, color: '#e6cfd8' },
        props: { angularVelocity: 0.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 4.5, y: 130.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 5.0, height: 0.1, rotation: 0, color: '#435585' },
        props: { density: 1, angularVelocity: 0.25, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 130.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 5.0, height: 0.1, rotation: 0, color: '#5c8374' },
        props: { density: 1, angularVelocity: -0.32, restitution: 0 },
      },
      {
        position: { x: 4.5, y: 140.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 4.0, height: 0.1, rotation: 30, color: '#610c9f' },
        props: { density: 1, angularVelocity: 0.32, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 140.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 4.0, height: 0.1, rotation: -30, color: '#872341' },
        props: { density: 1, angularVelocity: -0.32, restitution: 0 },
      },
      {
        position: { x: 4.5, y: 150.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 5.0, height: 0.1, rotation: 60, color: '#503c3c' },
        props: { density: 1, angularVelocity: 0.32, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 150.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 5.0, height: 0.1, rotation: -60, color: '#5c5470' },
        props: { density: 1, angularVelocity: -0.32, restitution: 0 },
      },
      {
        position: { x: 4.5, y: 160.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 4.0, height: 0.1, rotation: 90, color: '#1a3636' },
        props: { density: 1, angularVelocity: 0.32, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 160.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 4.0, height: 0.1, rotation: -90, color: '#522258' },
        props: { density: 1, angularVelocity: -0.32, restitution: 0 },
      },

      {
        position: { x: 3.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 135.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 140.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 144.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 147.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 149.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 3.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 4.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 5.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 6.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 7.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 8.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 9.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 10.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 11.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 12.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 13.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 14.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 15.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 16.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 17.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 18.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },
      {
        position: { x: 19.5, y: 150.0 },
        type: 'static',
        shape: { type: 'circle', radius: 0.2, color: '#e6e1ae' },
        props: { angularVelocity: 1.0, density: 1, restitution: 1.5, life: 1 },
      },

      {
        position: { x: 4.5, y: 180.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 6.0, height: 0.1, rotation: 0, color: '#ccb1b1' },
        props: { density: 1, angularVelocity: 4.6, restitution: 0 },
      },
      {
        position: { x: 18.5, y: 180.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 7.0, height: 0.1, rotation: 0, color: '#b1ccb1' },
        props: { density: 1, angularVelocity: -4.0, restitution: 0 },
      },

      {
        position: { x: 11.5, y: 195.0 },
        type: 'kinematic',
        shape: { type: 'box', width: 8.0, height: 0.1, rotation: 0, color: '#b3ccff' },
        props: { density: 1, angularVelocity: 5.5, restitution: 0 },
      },
    ],
  },
];

export const stages: StageDef[] = curatedLunchStages.map((stage, index) =>
  sanitizeStage({
    ...stage,
    entities: buildSpectacleEntities(stage, index),
    backdrop: stage.backdrop ?? getStageBackdrop(index),
  })
);
