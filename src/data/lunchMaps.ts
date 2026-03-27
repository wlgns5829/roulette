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
