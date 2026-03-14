import type { MapEntity } from '../types/MapEntity.type';
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
  spinner(8.5, 54, 2.9, 3.1, '#f97316'),
  spinner(17.4, 75, 3.2, -3.6, '#fb7185'),
  spinner(12.9, 108.5, 4.1, 2.5, '#38bdf8'),
  ...pegField(7.2, 97.5, 5, 4, 2.2, 2.5, '#fde68a'),
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
    ],
    '#fff7ed'
  ),
];

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
  spinner(13, 58, 3.8, 2.8, '#f43f5e'),
  spinner(9.2, 95, 3.1, -3.8, '#fb7185'),
  spinner(16.8, 118, 3.6, 3.3, '#f59e0b'),
  ...pegField(6.3, 86, 6, 5, 2.15, 2.55, '#fcd34d'),
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
    ],
    '#fff7ed'
  ),
];

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
  spinner(9.4, 56.6, 2.6, 3.8, '#22d3ee'),
  spinner(16.6, 84.6, 2.6, -3.8, '#06b6d4'),
  spinner(9.6, 112.4, 2.6, 3.9, '#0ea5e9'),
  spinner(16.4, 140.2, 2.6, -4.2, '#38bdf8'),
  ...pegField(7.2, 133.5, 5, 4, 2.15, 2.45, '#dbeafe'),
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
    ],
    '#e0f2fe'
  ),
];

export const lunchStages: StageDef[] = [
  {
    title: '커피 러시',
    description: '젓는 막대, 각설탕, 점심시간 인파가 얽힌 좁은 통로입니다.',
    flavor: '짧고 빠르지만 갑작스러운 옆치기가 많은 맵입니다.',
    accent: '#f59e0b',
    goalY: 138,
    zoomY: 132,
    eventPool: pool('coffee-spill', 'espresso-shot', 'meeting-call', 'bean-burst'),
    entities: coffeeRunEntities,
  },
  {
    title: '간식 대소동',
    description: '디저트 트레이와 쿠키 핀, 그리고 결승 근처의 위험한 설탕 지대가 기다립니다.',
    flavor: '중반부터 순위가 자주 뒤집히는 통통 튀는 맵입니다.',
    accent: '#fb7185',
    goalY: 148,
    zoomY: 142,
    eventPool: pool('coffee-spill', 'meeting-call', 'bean-burst', 'sugar-crash'),
    entities: snackAttackEntities,
  },
  {
    title: '엘리베이터 카오스',
    description: '에어컨 바람과 엘리베이터 문이 번갈아 흐름을 뒤흔드는 사무실 코스입니다.',
    flavor: '하단에서 막판 역전이 자주 터지는 전략형 맵입니다.',
    accent: '#38bdf8',
    goalY: 156,
    zoomY: 149,
    eventPool: pool('ac-draft', 'meeting-call', 'espresso-shot', 'sugar-crash'),
    entities: elevatorChaosEntities,
  },
];
