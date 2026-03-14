import type { LunchEventId, LunchEventNotice } from '../types/RoundEvent.type';

const eventCatalog: Record<LunchEventId, Omit<LunchEventNotice, 'id'>> = {
  'coffee-spill': {
    title: '커피 쏟음',
    description: '트레이가 기울어지며 전체 구슬이 한쪽으로 미끄러집니다.',
    accent: '#b7791f',
  },
  'espresso-shot': {
    title: '에스프레소 샷',
    description: '카페인 부스트가 터지며 라운드 전체 속도가 빨라집니다.',
    accent: '#f97316',
  },
  'meeting-call': {
    title: '회의 호출',
    description: '휴대폰이 울리고 의자가 밀리며 구슬들이 동시에 흔들립니다.',
    accent: '#38bdf8',
  },
  'ac-draft': {
    title: '에어컨 바람',
    description: '차가운 사무실 바람이 구슬들의 진행 방향을 틀어버립니다.',
    accent: '#22d3ee',
  },
  'bean-burst': {
    title: '원두 폭발',
    description: '원두 봉지가 터지며 구슬 무리에 충격파가 퍼집니다.',
    accent: '#ef4444',
  },
  'sugar-crash': {
    title: '당 충전 끊김',
    description: '순간적으로 힘이 빠지며 전체 라운드가 느려집니다.',
    accent: '#a78bfa',
  },
  'shark-rush': {
    title: '상어 난입',
    description: '귀여운 상어가 옆 라인에서 튀어나와 구슬 흐름을 휘저어 놓습니다.',
    accent: '#60a5fa',
  },
};

export const defaultLunchEventPool: LunchEventId[] = [
  'coffee-spill',
  'espresso-shot',
  'meeting-call',
  'ac-draft',
  'bean-burst',
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
