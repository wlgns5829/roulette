import type { LunchEventId, LunchEventNotice } from '../types/RoundEvent.type';

const eventCatalog: Record<LunchEventId, Omit<LunchEventNotice, 'id'>> = {
  'coffee-spill': {
    title: '커피 쏟음',
    description: '바닥에 커피가 번지며 구슬들이 한쪽으로 미끄러집니다.',
    accent: '#b7791f',
  },
  'espresso-shot': {
    title: '에스프레소 샷',
    description: '카페인 부스트가 들어와 전체 속도가 잠깐 빨라집니다.',
    accent: '#f97316',
  },
  'meeting-call': {
    title: '회의 호출',
    description: '갑작스러운 호출에 모두가 흔들리며 라인이 뒤엉킵니다.',
    accent: '#38bdf8',
  },
  'ac-draft': {
    title: '에어컨 바람',
    description: '옆에서 강한 바람이 불어 구슬 진행 방향이 꺾입니다.',
    accent: '#22d3ee',
  },
  'bean-burst': {
    title: '원두 폭발',
    description: '원두 포대가 터지며 중심 구슬 주변으로 충격파가 퍼집니다.',
    accent: '#ef4444',
  },
  'bomb-burst': {
    title: '점심 폭탄',
    description: '폭탄이 펑펑 터지며 근처 구슬들의 위치가 크게 뒤집힙니다.',
    accent: '#ef4444',
  },
  'sugar-crash': {
    title: '당 충전 방전',
    description: '순간적으로 힘이 빠지며 전체 흐름이 느려집니다.',
    accent: '#a78bfa',
  },
  'shark-rush': {
    title: '바다 생물 난입',
    description: '상어, 불가사리, 문어 떼가 옆 라인에서 튀어나와 구슬 흐름을 거칠게 흔듭니다.',
    accent: '#60a5fa',
  },
};

export const defaultLunchEventPool: LunchEventId[] = [
  'coffee-spill',
  'espresso-shot',
  'meeting-call',
  'ac-draft',
  'bean-burst',
  'bomb-burst',
  'sugar-crash',
  'shark-rush',
];

export function getLunchEventNotice(id: LunchEventId): LunchEventNotice {
  return {
    id,
    ...eventCatalog[id],
  };
}

export function getLunchEventTitles(ids: LunchEventId[]): string[] {
  return ids.map((id) => eventCatalog[id].title);
}
