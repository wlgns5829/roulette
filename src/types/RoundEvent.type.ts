export type LunchEventId =
  | 'coffee-spill'
  | 'espresso-shot'
  | 'meeting-call'
  | 'ac-draft'
  | 'bean-burst'
  | 'bomb-burst'
  | 'sugar-crash'
  | 'shark-rush';

export type LunchEventNotice = {
  id: LunchEventId;
  title: string;
  description: string;
  accent: string;
};
