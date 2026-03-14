import type { LunchEventId, LunchEventNotice } from '../types/RoundEvent.type';

const eventCatalog: Record<LunchEventId, Omit<LunchEventNotice, 'id'>> = {
  'coffee-spill': {
    title: 'Coffee Spill',
    description: 'A tray tips over and the whole pack slides sideways.',
    accent: '#b7791f',
  },
  'espresso-shot': {
    title: 'Espresso Shot',
    description: 'The room gets a caffeine jolt and the whole round speeds up.',
    accent: '#f97316',
  },
  'meeting-call': {
    title: 'Meeting Call',
    description: 'Phones buzz, chairs move, and every marble panics at once.',
    accent: '#38bdf8',
  },
  'ac-draft': {
    title: 'AC Draft',
    description: 'Cold office air blows the race off its clean line.',
    accent: '#22d3ee',
  },
  'bean-burst': {
    title: 'Bean Burst',
    description: 'A bag of beans pops and sends a shockwave through the pack.',
    accent: '#ef4444',
  },
  'sugar-crash': {
    title: 'Sugar Crash',
    description: 'Everything slows for a beat while the room loses momentum.',
    accent: '#a78bfa',
  },
};

export const defaultLunchEventPool: LunchEventId[] = [
  'coffee-spill',
  'espresso-shot',
  'meeting-call',
  'ac-draft',
  'bean-burst',
  'sugar-crash',
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
