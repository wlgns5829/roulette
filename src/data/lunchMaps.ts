import type { EntityMotion, MapEntity } from '../types/MapEntity.type';
import type { LunchEventId } from '../types/RoundEvent.type';
import type { StageDef } from './maps';

type Point = [number, number];

function wall(points: Point[], color = '#f7f0d2'): MapEntity {
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

function box(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  color: string,
  restitution = 0,
  type: 'static' | 'kinematic' = 'static',
  angularVelocity = 0
): MapEntity {
  return {
    position: { x, y },
    type,
    shape: { type: 'box', width, height, rotation, color, bloomColor: color },
    props: { density: 1, angularVelocity, restitution },
  };
}

function spinner(x: number, y: number, width: number, angularVelocity: number, color: string): MapEntity {
  return box(x, y, width, 0.13, 0, color, 0, 'kinematic', angularVelocity);
}

function movingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  color: string,
  motion: EntityMotion,
  restitution = 0,
  angularVelocity = 0
): MapEntity {
  return {
    position: { x, y },
    type: 'kinematic',
    shape: { type: 'box', width, height, rotation, color, bloomColor: color },
    props: { density: 1, angularVelocity, restitution },
    motion,
  };
}

function bumper(x: number, y: number, radius: number, color: string, restitution = 1.2, life = -1): MapEntity {
  return {
    position: { x, y },
    type: 'static',
    shape: { type: 'circle', radius, color, bloomColor: color },
    props: { density: 1, angularVelocity: 0, restitution, life },
  };
}

function pegField(
  startX: number,
  startY: number,
  cols: number,
  rows: number,
  gapX: number,
  gapY: number,
  color: string
): MapEntity[] {
  const pegs: MapEntity[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offset = row % 2 === 0 ? 0 : gapX / 2;
      pegs.push(bumper(startX + offset + col * gapX, startY + row * gapY, 0.24, color, 1.25));
    }
  }
  return pegs;
}

function sugarBits(points: Point[], color: string): MapEntity[] {
  return points.map(([x, y]) => bumper(x, y, 0.22, color, 1.5, 1));
}

function pool(...ids: LunchEventId[]): LunchEventId[] {
  return ids;
}

function swapColor(color: string | undefined, replacements: Record<string, string>) {
  if (!color) return color;
  return replacements[color] ?? color;
}

function recolorEntities(entities: MapEntity[], replacements: Record<string, string>): MapEntity[] {
  return entities.map((entity) => ({
    ...entity,
    shape: {
      ...entity.shape,
      color: swapColor(entity.shape.color, replacements),
      bloomColor: swapColor(entity.shape.bloomColor, replacements),
    },
  }));
}

const trackWidth = 26;

function cloneEntity(entity: MapEntity): MapEntity {
  return {
    ...entity,
    position: { ...entity.position },
    props: { ...entity.props },
    motion: entity.motion ? { ...entity.motion } : undefined,
    shape:
      entity.shape.type === 'polyline'
        ? {
            ...entity.shape,
            points: entity.shape.points.map(([x, y]) => [x, y] as Point),
          }
        : { ...entity.shape },
  };
}

function cloneEntities(entities: MapEntity[]): MapEntity[] {
  return entities.map(cloneEntity);
}

function mirrorEntities(entities: MapEntity[], width = trackWidth): MapEntity[] {
  return entities.map((entity) => {
    const mirrored = cloneEntity(entity);
    mirrored.position.x = width - mirrored.position.x;
    mirrored.props.angularVelocity *= -1;

    if (mirrored.motion?.axis === 'x') {
      mirrored.motion.phase = (mirrored.motion.phase ?? 0) + Math.PI;
    }

    if (mirrored.shape.type === 'box') {
      mirrored.shape.rotation *= -1;
    }

    if (mirrored.shape.type === 'polyline') {
      mirrored.shape.points = mirrored.shape.points.map(([x, y]) => [width - x, y]);
    }

    return mirrored;
  });
}

function tuneEntities(
  entities: MapEntity[],
  {
    angularScale = 1,
    motionScale = 1,
    restitutionBoost = 0,
  }: { angularScale?: number; motionScale?: number; restitutionBoost?: number } = {}
): MapEntity[] {
  return entities.map((entity) => {
    const tuned = cloneEntity(entity);
    tuned.props.angularVelocity *= angularScale;
    tuned.props.restitution = Math.max(0, Math.min(1.8, tuned.props.restitution + restitutionBoost));

    if (tuned.motion) {
      tuned.motion.speed *= motionScale;
      tuned.motion.amplitude *= 0.94 + motionScale * 0.12;
    }

    return tuned;
  });
}

function combineEntities(...groups: MapEntity[][]): MapEntity[] {
  return groups.flatMap((group) => cloneEntities(group));
}

function buildVariantStage(
  base: StageDef,
  overrides: Omit<Partial<StageDef>, 'entities'> & { entities?: MapEntity[] }
): StageDef {
  return {
    ...base,
    ...overrides,
    entities: overrides.entities ? cloneEntities(overrides.entities) : cloneEntities(base.entities ?? []),
  };
}

function slalomBars(startY: number, rows: number, gapY: number, colorA: string, colorB: string): MapEntity[] {
  const entities: MapEntity[] = [];

  for (let index = 0; index < rows; index++) {
    const y = startY + index * gapY;
    const fromLeft = index % 2 === 0;
    entities.push(box(fromLeft ? 8.1 : 17.9, y, 1.8, 0.1, fromLeft ? 0.62 : -0.62, fromLeft ? colorA : colorB));
    entities.push(box(fromLeft ? 15.8 : 10.2, y + gapY * 0.34, 1.45, 0.1, fromLeft ? -0.52 : 0.52, fromLeft ? colorB : colorA));
  }

  return entities;
}

function gatePairs(startY: number, rows: number, gapY: number, colorA: string, colorB: string): MapEntity[] {
  const entities: MapEntity[] = [];

  for (let index = 0; index < rows; index++) {
    const y = startY + index * gapY;
    entities.push(
      movingBox(8.8, y, 1.65, 0.11, 0.08, colorA, {
        axis: 'x',
        amplitude: 1.15,
        speed: 1.12 + index * 0.08,
        phase: index * 0.6,
      })
    );
    entities.push(
      movingBox(17.2, y + gapY * 0.38, 1.65, 0.11, -0.08, colorB, {
        axis: 'x',
        amplitude: 1.05,
        speed: 1.2 + index * 0.08,
        phase: index * 0.7 + 1.2,
      })
    );
  }

  return entities;
}

function spinnerLadder(startY: number, rows: number, gapY: number, colorA: string, colorB: string): MapEntity[] {
  const entities: MapEntity[] = [];

  for (let index = 0; index < rows; index++) {
    const y = startY + index * gapY;
    const left = index % 2 === 0;
    entities.push(spinner(left ? 9.1 : 16.9, y, 2.7 + (index % 2) * 0.5, left ? 4.7 : -4.7, left ? colorA : colorB));
    entities.push(spinner(left ? 16.2 : 9.8, y + gapY * 0.42, 2.2, left ? -4.2 : 4.2, left ? colorB : colorA));
  }

  return entities;
}

function bumperGarden(startY: number, rows: number, gapY: number, colorA: string, colorB: string): MapEntity[] {
  const entities: MapEntity[] = [];

  for (let row = 0; row < rows; row++) {
    const y = startY + row * gapY;
    const offset = row % 2 === 0 ? 0 : 1.15;
    for (let col = 0; col < 4; col++) {
      const x = 8.1 + offset + col * 2.6;
      entities.push(bumper(x, y, 0.28 + ((row + col) % 2) * 0.03, (row + col) % 2 === 0 ? colorA : colorB, 1.34));
    }
  }

  return entities;
}

function coffeeShowdownFinale(startY: number): MapEntity[] {
  return [
    wall(
      [
        [11.8, startY],
        [9.6, startY + 6.2],
        [10.4, startY + 15.2],
        [12.1, startY + 24.4],
      ],
      '#f8fafc'
    ),
    wall(
      [
        [14.2, startY],
        [16.4, startY + 6.2],
        [15.6, startY + 15.2],
        [13.9, startY + 24.4],
      ],
      '#fdba74'
    ),
    ...gatePairs(startY + 4.4, 2, 8.8, '#fff7ed', '#fdba74'),
    spinner(13, startY + 13.4, 4.4, -5, '#38bdf8'),
    ...pegField(9.1, startY + 19.8, 4, 2, 2.1, 2.45, '#ffffff'),
    movingBox(13, startY + 26.2, 2.2, 0.11, 0, '#fff7ed', {
      axis: 'x',
      amplitude: 1.62,
      speed: 1.82,
      phase: 0.45,
    }),
    bumper(10.2, startY + 29.1, 0.3, '#fdba74', 1.32),
    bumper(15.8, startY + 29.1, 0.3, '#fdba74', 1.32),
    spinner(13, startY + 31.6, 2.5, 4.8, '#f97316'),
    ...sugarBits(
      [
        [10.3, startY + 33.1],
        [13, startY + 34.3],
        [15.7, startY + 33.1],
      ],
      '#fff7ed'
    ),
  ];
}

function splashShowdownFinale(startY: number): MapEntity[] {
  return [
    wall(
      [
        [11.7, startY],
        [9.8, startY + 6.8],
        [10.6, startY + 15.6],
        [12.3, startY + 25.8],
      ],
      '#fff1c2'
    ),
    wall(
      [
        [14.3, startY],
        [16.2, startY + 6.8],
        [15.4, startY + 15.6],
        [13.7, startY + 25.8],
      ],
      '#fff1c2'
    ),
    ...spinnerLadder(startY + 4.8, 2, 9.4, '#ff6791', '#ffd85f'),
    movingBox(13, startY + 13.6, 2.15, 0.11, 0, '#fff8ef', {
      axis: 'x',
      amplitude: 1.72,
      speed: 1.56,
      phase: 0.35,
    }),
    ...bumperGarden(startY + 19.8, 2, 7.2, '#fff8ef', '#ffe5a7'),
    spinner(13, startY + 27.8, 3.2, -5.1, '#ff8c5d'),
    movingBox(13, startY + 31.6, 2.05, 0.11, 0, '#ffe5a7', {
      axis: 'y',
      amplitude: 1.12,
      speed: 1.74,
      phase: 1.1,
    }),
  ];
}

function snackShowdownFinale(startY: number): MapEntity[] {
  return [
    wall(
      [
        [11.9, startY],
        [9.6, startY + 6.6],
        [10.5, startY + 15.1],
        [12.2, startY + 24.6],
      ],
      '#fff0d8'
    ),
    wall(
      [
        [14.1, startY],
        [16.4, startY + 6.6],
        [15.5, startY + 15.1],
        [13.8, startY + 24.6],
      ],
      '#fff0d8'
    ),
    ...slalomBars(startY + 4.2, 2, 8.6, '#ffb48a', '#ffd166'),
    ...bumperGarden(startY + 12.2, 2, 7.1, '#fffef6', '#ffd166'),
    spinner(13, startY + 19.8, 4.2, -5, '#ff5d73'),
    ...pegField(9.1, startY + 25.4, 4, 2, 2.05, 2.4, '#fffdf8'),
    movingBox(13, startY + 29.4, 2.2, 0.11, 0, '#fff1dc', {
      axis: 'x',
      amplitude: 1.52,
      speed: 1.76,
      phase: 0.32,
    }),
    spinner(13, startY + 32.2, 2.5, 4.9, '#ffcb53'),
    ...sugarBits(
      [
        [10.5, startY + 33.8],
        [13, startY + 35],
        [15.5, startY + 33.8],
      ],
      '#fff1dc'
    ),
  ];
}

const coffeeRunEntities: MapEntity[] = [
  wall([
    [2, -260],
    [2, 18],
    [4.25, 24],
    [4.25, 40],
    [7.25, 48],
    [7.25, 62],
    [3.5, 72],
    [3.5, 88],
    [7.25, 98],
    [7.25, 117],
    [11.8, 132.5],
    [11.8, 138.5],
  ]),
  wall([
    [24, -260],
    [24, 18],
    [21.75, 24],
    [21.75, 40],
    [18.75, 48],
    [18.75, 62],
    [22.5, 72],
    [22.5, 88],
    [18.75, 98],
    [18.75, 117],
    [14.2, 132.5],
    [14.2, 138.5],
  ]),
  wall(
    [
      [9.2, 31],
      [13.2, 36],
      [10.8, 43],
      [15.5, 49],
    ],
    '#ffd29d'
  ),
  wall(
    [
      [16.8, 56],
      [12.6, 62],
      [15.6, 69],
      [9.8, 77],
    ],
    '#ffd29d'
  ),
  box(8.2, 29.5, 1.4, 0.1, 0.72, '#f8c471'),
  box(17.8, 42.5, 1.5, 0.1, -0.66, '#f8c471'),
  box(8.6, 66.5, 1.5, 0.1, -0.7, '#f8c471'),
  box(17.2, 90.5, 1.5, 0.1, 0.7, '#f8c471'),
  box(11.1, 47.8, 1.15, 0.1, 0.54, '#f8fafc'),
  box(14.9, 58.6, 1.2, 0.1, -0.52, '#e2e8f0'),
  box(10.6, 78.2, 1.15, 0.1, 0.5, '#fdba74'),
  box(15.6, 99.8, 1.1, 0.1, -0.48, '#fdba74'),
  movingBox(13, 36.6, 1.9, 0.11, 0.1, '#fff7ed', { axis: 'x', amplitude: 1.2, speed: 1.1, phase: 0.3 }),
  movingBox(11.7, 87.4, 1.6, 0.11, -0.18, '#fdba74', { axis: 'y', amplitude: 1.35, speed: 1.35, phase: 1.4 }),
  movingBox(14.6, 117.8, 1.7, 0.11, 0.16, '#fb923c', { axis: 'x', amplitude: 1.05, speed: 1.5, phase: 2.2 }),
  spinner(8.5, 54, 2.9, 4.2, '#f97316'),
  spinner(17.4, 75, 3.2, -4.5, '#fb7185'),
  spinner(12.9, 108.5, 4.1, 3.4, '#38bdf8'),
  spinner(12.9, 123.5, 2.8, -4.1, '#f8fafc'),
  spinner(13.1, 130.4, 2.2, 4.4, '#fdba74'),
  ...pegField(8.4, 46.5, 4, 3, 2.15, 2.35, '#ffffff'),
  ...pegField(7.2, 97.5, 5, 4, 2.2, 2.5, '#f8fafc'),
  ...sugarBits(
    [
      [10.2, 84],
      [12.3, 86],
      [14.2, 84.8],
      [15.8, 88.4],
      [9.2, 112],
      [11.4, 114],
      [15.6, 112.6],
      [17.4, 115.2],
      [10.4, 126.2],
      [12.8, 128.5],
      [15.3, 126.7],
    ],
    '#fff7ed'
  ),
  ...coffeeShowdownFinale(124.5),
];

const summerSplashEntities: MapEntity[] = [
  wall([
    [2, -260],
    [2, 18],
    [4.8, 25],
    [4.8, 39],
    [3.7, 50],
    [6.5, 63],
    [5.4, 78],
    [8.6, 92],
    [7.6, 108],
    [10.1, 121.5],
    [11.7, 132.8],
    [11.7, 138.5],
  ]),
  wall([
    [24, -260],
    [24, 18],
    [21.2, 25],
    [21.2, 39],
    [22.3, 50],
    [19.5, 63],
    [20.6, 78],
    [17.4, 92],
    [18.4, 108],
    [15.9, 121.5],
    [14.3, 132.8],
    [14.3, 138.5],
  ]),
  wall(
    [
      [5.8, 31.5],
      [10.2, 37.2],
      [7.8, 45],
      [12.8, 51.2],
      [9.4, 58.8],
    ],
    '#ffb168'
  ),
  wall(
    [
      [20.2, 43.8],
      [15.7, 49.2],
      [18.5, 57.2],
      [13.4, 64.4],
      [16.4, 71.6],
    ],
    '#ff946d'
  ),
  wall(
    [
      [6.5, 74.4],
      [10.8, 81.2],
      [8.8, 89.8],
      [12.8, 96.8],
    ],
    '#ffd27a'
  ),
  wall(
    [
      [19.5, 86.8],
      [15.4, 93.4],
      [17.8, 101.8],
      [13.9, 108.8],
    ],
    '#ffd27a'
  ),
  wall(
    [
      [7.8, 114.6],
      [9.8, 119.8],
      [9.5, 126.4],
      [10.8, 131.6],
    ],
    '#fff1c2'
  ),
  wall(
    [
      [18.2, 114.8],
      [16.2, 120],
      [16.5, 126.6],
      [15.2, 131.8],
    ],
    '#fff1c2'
  ),
  box(8.1, 28.8, 1.5, 0.1, 0.7, '#ffd166'),
  box(17.9, 35.8, 1.5, 0.1, -0.68, '#ffd166'),
  box(9.3, 69.6, 1.25, 0.1, -0.56, '#fff8ef'),
  box(16.7, 83.5, 1.25, 0.1, 0.54, '#ffe2a8'),
  box(10.4, 110.4, 1.2, 0.1, 0.44, '#fff8ef'),
  box(15.6, 118.6, 1.15, 0.1, -0.46, '#ffcd73'),
  movingBox(13, 41.8, 2, 0.11, 0.04, '#fff8ef', { axis: 'x', amplitude: 1.4, speed: 1, phase: 0.2 }),
  movingBox(10.6, 86.4, 1.75, 0.11, 0.18, '#ffcf7f', { axis: 'y', amplitude: 1.35, speed: 1.28, phase: 1.1 }),
  movingBox(15.4, 103.6, 1.75, 0.11, -0.18, '#fff8ef', { axis: 'x', amplitude: 1.15, speed: 1.46, phase: 2.4 }),
  movingBox(9.4, 124.8, 1.7, 0.11, 0.04, '#ffe5a7', { axis: 'y', amplitude: 1.05, speed: 1.4, phase: 0.9 }),
  movingBox(16.6, 125.2, 1.7, 0.11, -0.04, '#ffe5a7', { axis: 'y', amplitude: 1.05, speed: 1.46, phase: 2.1 }),
  spinner(8.6, 55.5, 3, 4.1, '#ff8c5d'),
  spinner(17.2, 76.8, 3.1, -4.5, '#ff6791'),
  spinner(12.9, 99.8, 4.2, 3.2, '#ffd85f'),
  spinner(13, 118.8, 2.1, -4.2, '#fff8ef'),
  ...pegField(7.1, 61.5, 5, 3, 2.2, 2.55, '#fffdf8'),
  ...pegField(7.4, 106.8, 5, 4, 2.15, 2.48, '#ffe8b4'),
  ...pegField(7.7, 122.8, 2, 2, 2.4, 2.5, '#fff5da'),
  ...pegField(15.1, 122.8, 2, 2, 2.4, 2.5, '#fff5da'),
  ...sugarBits(
    [
      [6.9, 48.5],
      [18.9, 66.8],
      [8.9, 97.2],
      [11.4, 99.4],
      [14.8, 97.6],
      [17.2, 100],
      [8.5, 121.6],
      [17.1, 121.8],
      [9.7, 132.2],
      [16.1, 132.4],
    ],
    '#fff8ef'
  ),
  ...splashShowdownFinale(126.4),
];

const summerSplashStage: Partial<StageDef> = {
  title: '역류 서프 라이드',
  description: '아래에서 위로 솟아오르는 해류를 타고, 중간 소용돌이와 파도 게이트를 뚫고 올라가는 기본 맵입니다.',
  flavor:
    '초반엔 넓게 퍼지고 중반엔 원형 회전 구간에서 섞인 뒤, 마지막 좁은 게이트에서 순위가 뒤집히도록 설계했습니다.',
  accent: '#38bdf8',
  entities: summerSplashEntities,
};

const snackAttackEntities: MapEntity[] = [
  wall([
    [2, -260],
    [2, 16],
    [5.2, 24],
    [5.2, 42],
    [3.8, 54],
    [3.8, 72],
    [7.1, 82],
    [7.1, 101],
    [4.1, 112],
    [4.1, 129],
    [9, 140],
    [11.7, 148.4],
  ]),
  wall([
    [24, -260],
    [24, 16],
    [20.8, 24],
    [20.8, 42],
    [22.2, 54],
    [22.2, 72],
    [18.9, 82],
    [18.9, 101],
    [21.9, 112],
    [21.9, 129],
    [17, 140],
    [14.3, 148.4],
  ]),
  wall(
    [
      [6.4, 33],
      [11.4, 37.5],
      [8.8, 44.5],
      [15.1, 49.5],
      [11.4, 57.2],
    ],
    '#fecaca'
  ),
  wall(
    [
      [19.7, 63],
      [14.8, 68.2],
      [18.1, 75.6],
      [11.3, 83.6],
      [14.6, 92],
    ],
    '#fecaca'
  ),
  box(8.1, 70.4, 1.2, 0.1, -0.54, '#fb7185'),
  box(17.6, 79.2, 1.2, 0.1, 0.48, '#fda4af'),
  box(9.1, 106.5, 1.25, 0.1, 0.58, '#fdba74'),
  box(17.1, 132.8, 1.15, 0.1, -0.5, '#f3f4f6'),
  movingBox(13.2, 50.5, 2, 0.11, -0.08, '#ffe4e6', { axis: 'x', amplitude: 1.28, speed: 1.18, phase: 0.7 }),
  movingBox(10.7, 97.8, 1.7, 0.11, 0.18, '#fff1f2', { axis: 'y', amplitude: 1.25, speed: 1.4, phase: 1.8 }),
  movingBox(15.2, 123.8, 1.9, 0.11, -0.12, '#fda4af', { axis: 'x', amplitude: 1.08, speed: 1.62, phase: 2.6 }),
  spinner(13, 58, 3.8, 3.7, '#f43f5e'),
  spinner(9.2, 95, 3.1, -4.7, '#fb7185'),
  spinner(16.8, 118, 3.6, 4.4, '#f59e0b'),
  spinner(13.2, 138.2, 2.8, -4.3, '#f8fafc'),
  spinner(12.8, 143.8, 2.1, 4.1, '#fb7185'),
  ...pegField(7.2, 72, 5, 3, 2.2, 2.45, '#fecdd3'),
  ...pegField(6.3, 86, 6, 5, 2.15, 2.55, '#ffffff'),
  ...pegField(8.2, 125, 4, 3, 2.4, 2.6, '#fdba74'),
  ...sugarBits(
    [
      [8.2, 59.5],
      [10.8, 62.2],
      [15.2, 61.4],
      [17.6, 65.4],
      [7.6, 109.2],
      [10.1, 111.4],
      [15.7, 108.8],
      [18.1, 111.2],
      [10.5, 137.4],
      [12.9, 139.2],
      [15.1, 137.6],
    ],
    '#fff7ed'
  ),
  ...snackShowdownFinale(131.8),
];

const snackAttackVisibleEntities = recolorEntities(snackAttackEntities, {
  '#fecaca': '#fff0d8',
  '#fb7185': '#ff7a59',
  '#fda4af': '#ffb48a',
  '#fdba74': '#ffd166',
  '#f3f4f6': '#fffef6',
  '#ffe4e6': '#fff4e5',
  '#fff1f2': '#fff8ec',
  '#f43f5e': '#ff5d73',
  '#f59e0b': '#ffcb53',
  '#fecdd3': '#ffe0c2',
  '#ffffff': '#fffdf8',
  '#fff7ed': '#fff1dc',
});

const elevatorChaosEntities: MapEntity[] = [
  wall([
    [2, -260],
    [2, 18],
    [2.6, 44],
    [5.1, 52],
    [5.1, 70],
    [2.8, 79],
    [2.8, 99],
    [5.8, 109],
    [5.8, 129],
    [3.2, 138],
    [3.2, 149],
    [11.7, 156.6],
  ]),
  wall([
    [24, -260],
    [24, 18],
    [23.4, 44],
    [20.9, 52],
    [20.9, 70],
    [23.2, 79],
    [23.2, 99],
    [20.2, 109],
    [20.2, 129],
    [22.8, 138],
    [22.8, 149],
    [14.3, 156.6],
  ]),
  wall(
    [
      [7.1, 39],
      [12, 39],
      [12, 50],
      [7.4, 50],
    ],
    '#bfdbfe'
  ),
  wall(
    [
      [14, 57],
      [18.9, 57],
      [18.9, 68],
      [14.2, 68],
    ],
    '#bfdbfe'
  ),
  wall(
    [
      [7.1, 84],
      [11.8, 84],
      [11.8, 95],
      [7.4, 95],
    ],
    '#bfdbfe'
  ),
  wall(
    [
      [14.2, 111],
      [18.9, 111],
      [18.9, 122],
      [14, 122],
    ],
    '#bfdbfe'
  ),
  box(13, 45.5, 2.2, 0.1, 0, '#93c5fd'),
  box(13, 72.8, 2.2, 0.1, 0, '#93c5fd'),
  box(13, 100.5, 2.2, 0.1, 0, '#93c5fd'),
  box(13, 128.2, 2.2, 0.1, 0, '#93c5fd'),
  box(8.9, 63.6, 1.15, 0.1, 0.52, '#7dd3fc'),
  box(17.1, 91.4, 1.15, 0.1, -0.52, '#7dd3fc'),
  box(8.8, 118.8, 1.05, 0.1, 0.54, '#67e8f9'),
  box(17.2, 145.1, 1.05, 0.1, -0.54, '#67e8f9'),
  movingBox(13, 53.8, 1.85, 0.11, 0, '#e0f2fe', { axis: 'y', amplitude: 1.4, speed: 1.14, phase: 0.5 }),
  movingBox(13, 81.6, 1.7, 0.11, 0, '#f8fafc', { axis: 'x', amplitude: 1.18, speed: 1.35, phase: 1.3 }),
  movingBox(9.8, 136.2, 1.55, 0.11, 0.04, '#bae6fd', { axis: 'y', amplitude: 1.1, speed: 1.42, phase: 2.2 }),
  movingBox(16.2, 137, 1.55, 0.11, -0.04, '#bae6fd', { axis: 'y', amplitude: 1.1, speed: 1.48, phase: 0.9 }),
  spinner(9.4, 56.6, 2.6, 4.6, '#22d3ee'),
  spinner(16.6, 84.6, 2.6, -4.6, '#06b6d4'),
  spinner(9.6, 112.4, 2.6, 4.8, '#0ea5e9'),
  spinner(17.1, 139.8, 2.1, -4.2, '#38bdf8'),
  ...pegField(8.1, 60.8, 4, 3, 2.25, 2.55, '#bae6fd'),
  ...pegField(8.3, 116.6, 4, 3, 2.2, 2.45, '#bfdbfe'),
  ...pegField(7.4, 133.2, 2, 3, 2.35, 2.45, '#dbeafe'),
  ...pegField(15.2, 133.2, 2, 3, 2.35, 2.45, '#dbeafe'),
  ...sugarBits(
    [
      [6.8, 46.4],
      [18.9, 47.8],
      [7.3, 74.4],
      [18.5, 75.7],
      [7.1, 102.5],
      [18.8, 103.6],
      [7.2, 130.3],
      [18.5, 131.8],
      [9.4, 145.4],
      [16.5, 145.6],
    ],
    '#e0f2fe'
  ),
];

const elevatorChaosVisibleEntities = recolorEntities(elevatorChaosEntities, {
  '#bfdbfe': '#fff0d6',
  '#93c5fd': '#ffd86b',
  '#7dd3fc': '#ffb58a',
  '#67e8f9': '#ff8fab',
  '#e0f2fe': '#fffbf1',
  '#f8fafc': '#fffef9',
  '#bae6fd': '#ffe59d',
  '#22d3ee': '#ff8f5d',
  '#06b6d4': '#ff6b6b',
  '#0ea5e9': '#ffd166',
  '#38bdf8': '#ffe08a',
  '#dbeafe': '#fff3de',
});

export const lunchStages: StageDef[] = [
  {
    title: '커피 러시',
    description: '젓는 막대, 각설탕, 점심시간 인파가 얽힌 좁은 통로입니다.',
    flavor: '짧고 빠르지만 갑작스러운 옆치기가 많은 맵입니다.',
    accent: '#f59e0b',
    goalY: 136,
    zoomY: 129,
    eventPool: pool('coffee-spill', 'espresso-shot', 'meeting-call', 'bean-burst', 'bomb-burst', 'shark-rush'),
    entities: coffeeRunEntities,
    ...summerSplashStage,
  },
  {
    title: '간식 대소동',
    description: '디저트 트레이와 쿠키 핀, 그리고 결승 근처의 위험한 설탕 지대가 기다립니다.',
    flavor: '중반부터 순위가 자주 뒤집히는 통통 튀는 맵입니다.',
    accent: '#fb7185',
    goalY: 148,
    zoomY: 142,
    eventPool: pool('coffee-spill', 'meeting-call', 'bean-burst', 'bomb-burst', 'sugar-crash', 'shark-rush'),
    entities: snackAttackVisibleEntities,
  },
  {
    title: '엘리베이터 카오스',
    description: '에어컨 바람과 엘리베이터 문이 번갈아 흐름을 뒤흔드는 사무실 코스입니다.',
    flavor: '하단에서 막판 역전이 자주 터지는 전략형 맵입니다.',
    accent: '#38bdf8',
    goalY: 151,
    zoomY: 144,
    eventPool: pool('ac-draft', 'meeting-call', 'espresso-shot', 'bomb-burst', 'sugar-crash', 'shark-rush'),
    entities: elevatorChaosVisibleEntities,
  },
];

const curatedCoffeeRushStage: StageDef = {
  title: '커피 돌진로',
  description: '비스듬한 램프와 젓개, 설탕 핀이 초반부터 속도를 붙이고 마지막까지 선두를 압박하는 코스입니다.',
  flavor: '앞서 나가도 끝까지 안심할 수 없는 추격형 맵입니다.',
  accent: '#f59e0b',
  goalY: 158,
  zoomY: 151.5,
  eventPool: pool('coffee-spill', 'espresso-shot', 'meeting-call', 'bean-burst', 'bomb-burst', 'shark-rush'),
  entities: coffeeRunEntities,
};

const curatedSummerSplashStage: StageDef = {
  title: '파도 미끄럼 수로',
  description: '흐르는 경사와 떠다니는 관문, 회전 바가 이어지다가 후반에 거센 합류 구간이 열립니다.',
  flavor: '넓게 퍼지던 대열이 마지막에 다시 조여들어 화면이 살아나는 맵입니다.',
  accent: '#38bdf8',
  goalY: 159,
  zoomY: 152.5,
  eventPool: pool('coffee-spill', 'ac-draft', 'meeting-call', 'espresso-shot', 'shark-rush'),
  entities: summerSplashEntities,
};

const curatedSnackAttackStage: StageDef = {
  title: '간식 소용돌이',
  description: '빽빽한 핀과 늦게 움직이는 바가 후반부를 계속 비틀어 혼전으로 몰아넣는 코스입니다.',
  flavor: '선두가 한 번만 삐끗해도 무리가 다시 달라붙는 난전형 맵입니다.',
  accent: '#fb7185',
  goalY: 166,
  zoomY: 159,
  eventPool: pool('coffee-spill', 'meeting-call', 'bean-burst', 'bomb-burst', 'sugar-crash', 'shark-rush'),
  entities: snackAttackVisibleEntities,
};

const curatedLunchVariants: StageDef[] = [
  buildVariantStage(curatedCoffeeRushStage, {
    title: '커피 돌진로 반전',
    description: '같은 속도감을 뒤집어 놓은 반전 코스로, 익숙한 리듬을 반대로 읽어야 합니다.',
    flavor: '처음엔 익숙하지만 각도를 잘못 읽는 순간 바로 흐름이 꼬입니다.',
    accent: '#f97316',
    entities: combineEntities(
      recolorEntities(mirrorEntities(coffeeRunEntities), {
        '#f97316': '#fb7185',
        '#fb7185': '#38bdf8',
        '#38bdf8': '#f59e0b',
        '#fdba74': '#fde68a',
      }),
      slalomBars(59, 4, 13.4, '#fde68a', '#fb7185')
    ),
  }),
  buildVariantStage(curatedCoffeeRushStage, {
    title: '에스프레소 과속로',
    description: '회전과 이동 속도가 더 빨라져 선두가 오래 고정되지 않는 고속 코스입니다.',
    flavor: '초반은 시원하게 치고 나가고 막판은 크게 요동치는 방송형 맵입니다.',
    accent: '#ef4444',
    eventPool: pool('espresso-shot', 'coffee-spill', 'bomb-burst', 'shark-rush'),
    entities: combineEntities(
      tuneEntities(coffeeRunEntities, { angularScale: 1.2, motionScale: 1.18, restitutionBoost: 0.04 }),
      spinnerLadder(60, 3, 19, '#fca5a5', '#fde68a'),
      [
        spinner(13, 68.5, 3.5, -5.1, '#fde68a'),
        movingBox(13, 120.6, 2.1, 0.11, 0, '#fff7ed', { axis: 'x', amplitude: 1.65, speed: 1.8, phase: 0.4 }),
      ]
    ),
  }),
  buildVariantStage(curatedCoffeeRushStage, {
    title: '옆바람 커피 회랑',
    description: '비슷한 레인이지만 옆바람 변수와 재합류 구간이 더 자주 터지는 코스입니다.',
    flavor: '앞선 구슬도 계속 무리 속으로 다시 끌려 들어가는 추격형 맵입니다.',
    accent: '#38bdf8',
    eventPool: pool('ac-draft', 'coffee-spill', 'meeting-call', 'bomb-burst', 'shark-rush'),
    entities: combineEntities(
      coffeeRunEntities,
      gatePairs(72, 4, 14.5, '#dbeafe', '#bfdbfe'),
      [
        movingBox(8.4, 111.8, 1.9, 0.11, 0.08, '#dbeafe', { axis: 'y', amplitude: 1.35, speed: 1.42, phase: 0.2 }),
        movingBox(17.6, 111.8, 1.9, 0.11, -0.08, '#dbeafe', { axis: 'y', amplitude: 1.35, speed: 1.5, phase: 1.1 }),
        ...pegField(9.1, 123.4, 4, 2, 2.25, 2.35, '#ffffff'),
      ]
    ),
  }),
  buildVariantStage(curatedCoffeeRushStage, {
    title: '커피 핀볼 홀',
    description: '중반 범퍼 지대가 핀볼처럼 튕겨내고 마지막 회전문이 승부를 뒤집는 코스입니다.',
    flavor: '1등이 안전해 보여도 한 번의 이상한 튕김으로 끝이 바뀔 수 있습니다.',
    accent: '#fbbf24',
    eventPool: pool('bean-burst', 'meeting-call', 'bomb-burst', 'sugar-crash', 'shark-rush'),
    entities: combineEntities(
      coffeeRunEntities,
      bumperGarden(74, 3, 13.5, '#fde68a', '#fff7ed'),
      [
        bumper(9.2, 70.4, 0.33, '#fde68a', 1.35),
        bumper(16.8, 73.6, 0.33, '#fde68a', 1.35),
        bumper(13, 101.4, 0.34, '#fff7ed', 1.4),
        spinner(13, 116.2, 2.4, -4.8, '#fcd34d'),
      ]
    ),
  }),
  buildVariantStage(curatedSummerSplashStage, {
    title: '거울 물결 수로 · 좌우 질주',
    description: '물결 수로를 좌우로 뒤집은 코스로, 드리프트와 스피너 충돌이 다른 타이밍으로 들어옵니다.',
    flavor: '깔끔하게 보이지만 대열이 뭉치기 시작하면 훨씬 까다롭게 꼬입니다.',
    accent: '#0ea5e9',
    presentation: 'side-scroll',
    entities: combineEntities(
      recolorEntities(mirrorEntities(summerSplashEntities), {
        '#ff8c5d': '#38bdf8',
        '#ff6791': '#fb7185',
        '#ffd85f': '#fde68a',
        '#fff8ef': '#ffffff',
      }),
      spinnerLadder(63, 3, 20.5, '#7dd3fc', '#f9a8d4')
    ),
  }),
  buildVariantStage(curatedSummerSplashStage, {
    title: '소용돌이 물결관문',
    description: '하단 회전 장치를 늘려 선두권이 계속 서로 다시 부딪히게 만든 맵입니다.',
    flavor: '카메라가 1등 싸움에 오래 붙어 있기 좋은 난전형 코스입니다.',
    accent: '#06b6d4',
    eventPool: pool('ac-draft', 'espresso-shot', 'meeting-call', 'shark-rush'),
    entities: combineEntities(
      tuneEntities(summerSplashEntities, { angularScale: 1.12, motionScale: 1.1 }),
      spinnerLadder(70.5, 3, 20, '#67e8f9', '#bae6fd'),
      [spinner(13, 110.4, 3.6, -5.3, '#bae6fd'), ...pegField(8.1, 127.5, 4, 2, 2.4, 2.4, '#ecfeff')]
    ),
  }),
  buildVariantStage(curatedSummerSplashStage, {
    title: '조류 변속 수로',
    description: '이동 관문이 겹쳐서 열리고 닫히며 레이싱 라인이 계속 바뀌는 코스입니다.',
    flavor: '선두가 보여도 계속 길을 다시 찾아야 해서 긴장이 끊기지 않습니다.',
    accent: '#22c55e',
    eventPool: pool('coffee-spill', 'ac-draft', 'meeting-call', 'sugar-crash', 'shark-rush'),
    entities: combineEntities(
      summerSplashEntities,
      gatePairs(67.5, 4, 15.5, '#dcfce7', '#bbf7d0'),
      [
        movingBox(13, 66.8, 2.25, 0.11, 0.05, '#dcfce7', { axis: 'x', amplitude: 1.65, speed: 1.38, phase: 0.2 }),
        movingBox(13, 118.4, 2.15, 0.11, -0.05, '#bbf7d0', { axis: 'x', amplitude: 1.45, speed: 1.6, phase: 1.8 }),
        movingBox(13, 128.8, 1.8, 0.11, 0, '#f0fdf4', { axis: 'y', amplitude: 1.1, speed: 1.55, phase: 0.7 }),
      ]
    ),
  }),
  buildVariantStage(curatedSummerSplashStage, {
    title: '노을 물결 질주',
    description: '따뜻한 색감의 수로지만 하단 깔때기 구간에 추가 설탕 핀이 숨어 있는 코스입니다.',
    flavor: '부드러워 보이다가 마지막에 아주 날카롭게 압축되는 맵입니다.',
    accent: '#fb7185',
    entities: combineEntities(
      recolorEntities(summerSplashEntities, {
        '#ffb168': '#fb923c',
        '#ff946d': '#fb7185',
        '#ffd27a': '#fcd34d',
        '#fff1c2': '#fff7ed',
        '#ff8c5d': '#f97316',
        '#ff6791': '#ec4899',
      }),
      bumperGarden(82, 2, 18, '#fdba74', '#fff7ed'),
      [bumper(13.2, 121.8, 0.34, '#fff1c2', 1.35), ...sugarBits([[10.2, 129.6], [13, 131.1], [15.8, 129.8]], '#fff7ed')]
    ),
  }),
  buildVariantStage(curatedSummerSplashStage, {
    title: '달빛 파도길',
    description: '상단은 비교적 여유롭고 하단에 늦게 범퍼가 몰려 있는 차분한 변형입니다.',
    flavor: '초반에 벌어진 격차가 끝에서 다시 요란하게 흔들립니다.',
    accent: '#a78bfa',
    eventPool: pool('meeting-call', 'espresso-shot', 'bomb-burst', 'shark-rush'),
    entities: combineEntities(
      recolorEntities(summerSplashEntities, {
        '#ffb168': '#c4b5fd',
        '#ff946d': '#93c5fd',
        '#ffd27a': '#bfdbfe',
        '#ff6791': '#818cf8',
      }),
      [
        bumper(8.6, 118.8, 0.31, '#ddd6fe', 1.3),
        bumper(17.3, 118.8, 0.31, '#ddd6fe', 1.3),
        spinner(13, 127.8, 2.4, 4.9, '#c4b5fd'),
      ]
    ),
  }),
  buildVariantStage(curatedSnackAttackStage, {
    title: '뒤집힌 간식 미궁 · 좌우 질주',
    description: '핀벽과 바운스 판을 반대로 뒤집어 후반 혼전이 반대 리듬으로 몰아치는 코스입니다.',
    flavor: '단순히 뒤집혔을 뿐인데 끝부분 체감이 완전히 달라지는 맵입니다.',
    accent: '#f97316',
    presentation: 'side-scroll',
    entities: combineEntities(
      recolorEntities(mirrorEntities(snackAttackVisibleEntities), {
        '#ff7a59': '#fb7185',
        '#ffb48a': '#f59e0b',
        '#ffd166': '#fde68a',
        '#ff5d73': '#38bdf8',
      }),
      slalomBars(82, 4, 14.5, '#fdba74', '#fda4af')
    ),
  }),
  buildVariantStage(curatedSnackAttackStage, {
    title: '바삭 충돌지대',
    description: '회전과 반발이 더 늘고 마지막 분기에 믹서 관문이 하나 더 들어간 코스입니다.',
    flavor: '선두가 강해 보여도 좀처럼 깨끗한 공간을 확보하지 못합니다.',
    accent: '#ef4444',
    eventPool: pool('bean-burst', 'bomb-burst', 'espresso-shot', 'shark-rush'),
    entities: combineEntities(
      tuneEntities(snackAttackVisibleEntities, { angularScale: 1.16, motionScale: 1.12, restitutionBoost: 0.05 }),
      spinnerLadder(86, 3, 18, '#fb7185', '#fdba74'),
      [
        spinner(13, 111.4, 3.2, -4.9, '#fb7185'),
        movingBox(13, 140.8, 2.05, 0.11, 0, '#fff7ed', { axis: 'x', amplitude: 1.55, speed: 1.8, phase: 0.5 }),
      ]
    ),
  }),
  buildVariantStage(curatedSnackAttackStage, {
    title: '설탕 함정지대',
    description: '하단 레인에 작은 범퍼와 핀을 더 채워 끝까지 답답한 교통 체증을 만드는 코스입니다.',
    flavor: '결승 직전에 긴장을 길게 끌고 가기 좋은 함정형 맵입니다.',
    accent: '#f59e0b',
    eventPool: pool('coffee-spill', 'meeting-call', 'sugar-crash', 'shark-rush'),
    entities: combineEntities(
      snackAttackVisibleEntities,
      bumperGarden(102, 3, 14, '#fff8ec', '#ffe7ba'),
      [
        ...pegField(7.5, 134.2, 5, 2, 2.15, 2.4, '#fff8ec'),
        bumper(10.8, 143.4, 0.29, '#ffe7ba', 1.32),
        bumper(15.2, 143.4, 0.29, '#ffe7ba', 1.32),
      ]
    ),
  }),
  buildVariantStage(curatedSnackAttackStage, {
    title: '간식 폭주 회랑',
    description: '전체 보드가 더 빠르게 돌아가고 이동 바도 훨씬 공격적으로 왕복하는 코스입니다.',
    flavor: '막판 선두가 가장 믿기 어려운 변덕형 코스입니다.',
    accent: '#8b5cf6',
    eventPool: pool('espresso-shot', 'ac-draft', 'bomb-burst', 'shark-rush'),
    entities: combineEntities(
      recolorEntities(
        tuneEntities(snackAttackVisibleEntities, { angularScale: 1.08, motionScale: 1.2, restitutionBoost: 0.04 }),
        {
          '#ff7a59': '#c084fc',
          '#ffb48a': '#e9d5ff',
          '#ffd166': '#fde68a',
          '#ff5d73': '#a78bfa',
        }
      ),
      gatePairs(86, 3, 18, '#ddd6fe', '#c4b5fd'),
      [
        movingBox(9.5, 120.4, 1.8, 0.11, 0.12, '#ddd6fe', { axis: 'y', amplitude: 1.2, speed: 1.7, phase: 0.2 }),
        movingBox(16.5, 120.4, 1.8, 0.11, -0.12, '#ddd6fe', { axis: 'y', amplitude: 1.2, speed: 1.76, phase: 1.2 }),
      ]
    ),
  }),
  buildVariantStage(curatedCoffeeRushStage, {
    title: '심야 커피 회랑 · 좌우 질주',
    description: '늦은 관문이 더 오래 살아 있어 선두도 마지막에 한 번 더 검문을 당하는 코스입니다.',
    flavor: '정리된 듯 보이다가 하단 통로가 다시 대열을 끌어모읍니다.',
    accent: '#8b5cf6',
    presentation: 'side-scroll',
    eventPool: pool('espresso-shot', 'meeting-call', 'bomb-burst', 'shark-rush'),
    entities: combineEntities(
      recolorEntities(tuneEntities(coffeeRunEntities, { angularScale: 1.08, motionScale: 1.08 }), {
        '#f97316': '#8b5cf6',
        '#fb7185': '#60a5fa',
        '#38bdf8': '#c4b5fd',
        '#fdba74': '#e9d5ff',
        '#fff7ed': '#f5f3ff',
      }),
      gatePairs(130, 2, 9.6, '#ddd6fe', '#c4b5fd'),
      [spinner(13, 151.2, 3.8, -5.2, '#ddd6fe')]
    ),
  }),
  buildVariantStage(curatedCoffeeRushStage, {
    title: '커피 결전 분기점',
    description: '초반은 비교적 깨끗하지만 후반에는 선택지가 계속 이어져 한순간 방심하기 어려운 코스입니다.',
    flavor: '안전해 보이는 1등을 한 박자 늦게 무너뜨리도록 만든 맵입니다.',
    accent: '#06b6d4',
    eventPool: pool('coffee-spill', 'ac-draft', 'meeting-call', 'bean-burst', 'shark-rush'),
    entities: combineEntities(
      coffeeRunEntities,
      slalomBars(131.5, 2, 9.2, '#67e8f9', '#fef3c7'),
      [
        movingBox(13, 149.6, 2.25, 0.11, 0, '#ecfeff', { axis: 'x', amplitude: 1.75, speed: 1.88, phase: 0.7 }),
        bumper(13, 153.2, 0.34, '#fde68a', 1.38),
      ]
    ),
  }),
  buildVariantStage(curatedSummerSplashStage, {
    title: '폭풍 물결 레인 · 좌우 질주',
    description: '초반은 넓게 흐르다가 하단에서 거센 폭풍 조류처럼 빠르게 뒤엉키는 코스입니다.',
    flavor: '선두를 오래 쫓아가며 보는 맛이 살아나는 중계형 맵입니다.',
    accent: '#14b8a6',
    presentation: 'side-scroll',
    eventPool: pool('ac-draft', 'espresso-shot', 'meeting-call', 'bomb-burst', 'shark-rush'),
    entities: combineEntities(
      tuneEntities(summerSplashEntities, { angularScale: 1.08, motionScale: 1.1 }),
      spinnerLadder(131, 2, 9.8, '#67e8f9', '#f9a8d4'),
      [
        movingBox(13, 149.8, 2.2, 0.11, 0, '#ecfeff', { axis: 'x', amplitude: 1.82, speed: 1.82, phase: 0.5 }),
        spinner(13, 154.2, 2.6, 5.1, '#bae6fd'),
      ]
    ),
  }),
  buildVariantStage(curatedSnackAttackStage, {
    title: '마지막 한입 미궁',
    description: '하단 미로가 결승선 직전까지 계속 구슬을 물고 늘어지는 집요한 코스입니다.',
    flavor: '우승자가 결승을 두 번 뚫는 느낌을 주는 집념형 맵입니다.',
    accent: '#f97316',
    eventPool: pool('bean-burst', 'meeting-call', 'bomb-burst', 'sugar-crash', 'shark-rush'),
    entities: combineEntities(
      tuneEntities(snackAttackVisibleEntities, { angularScale: 1.06, motionScale: 1.08, restitutionBoost: 0.03 }),
      gatePairs(141.5, 2, 9.8, '#fff1dc', '#ffe7ba'),
      [spinner(13, 158.8, 3.7, -5.2, '#fff8ec'), ...pegField(9.2, 151.4, 3, 2, 2.15, 2.45, '#fffef6')]
    ),
  }),
];

export const curatedLunchStages: StageDef[] = [
  curatedCoffeeRushStage,
  curatedSummerSplashStage,
  curatedSnackAttackStage,
  ...curatedLunchVariants,
];
