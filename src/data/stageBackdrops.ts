export type StageBackdropId =
  | 'sakura-village'
  | 'sky-sanctum'
  | 'mushroom-square'
  | 'abyss-corridor'
  | 'aurora-village'
  | 'moon-market'
  | 'star-palace'
  | 'harvest-terrace';

export type StageBackdropPalette = {
  id: StageBackdropId;
  label: string;
  imageUrl: string;
  focusX: number;
  focusY: number;
  sceneTop: string;
  sceneMid: string;
  sceneBottom: string;
  uiTopLeft: string;
  uiTopRight: string;
  uiBottom: string;
  uiStart: string;
  uiMid: string;
  uiEnd: string;
  ambientOne: string;
  ambientTwo: string;
  ambientThree: string;
};

export const stageBackdrops: Record<StageBackdropId, StageBackdropPalette> = {
  'sakura-village': {
    id: 'sakura-village',
    label: '벚꽃 마을',
    imageUrl: new URL('../../assets/images/stage-backgrounds/1.jpg', import.meta.url).toString(),
    focusX: 0.48,
    focusY: 0.46,
    sceneTop: 'rgba(25, 20, 30, 0.16)',
    sceneMid: 'rgba(20, 24, 38, 0.28)',
    sceneBottom: 'rgba(11, 14, 22, 0.56)',
    uiTopLeft: 'rgba(255, 199, 222, 0.24)',
    uiTopRight: 'rgba(132, 222, 149, 0.14)',
    uiBottom: 'rgba(255, 244, 214, 0.1)',
    uiStart: '#2b2231',
    uiMid: '#1e1d2b',
    uiEnd: '#151821',
    ambientOne: 'rgba(255, 194, 214, 0.3)',
    ambientTwo: 'rgba(127, 223, 154, 0.22)',
    ambientThree: 'rgba(255, 241, 205, 0.18)',
  },
  'sky-sanctum': {
    id: 'sky-sanctum',
    label: '천공 성역',
    imageUrl: new URL('../../assets/images/stage-backgrounds/2.jpg', import.meta.url).toString(),
    focusX: 0.42,
    focusY: 0.4,
    sceneTop: 'rgba(223, 244, 255, 0.08)',
    sceneMid: 'rgba(38, 98, 146, 0.18)',
    sceneBottom: 'rgba(9, 30, 57, 0.5)',
    uiTopLeft: 'rgba(184, 228, 255, 0.22)',
    uiTopRight: 'rgba(255, 245, 196, 0.16)',
    uiBottom: 'rgba(154, 218, 255, 0.1)',
    uiStart: '#16283a',
    uiMid: '#17344d',
    uiEnd: '#101d2f',
    ambientOne: 'rgba(196, 231, 255, 0.26)',
    ambientTwo: 'rgba(255, 236, 176, 0.2)',
    ambientThree: 'rgba(102, 190, 255, 0.22)',
  },
  'mushroom-square': {
    id: 'mushroom-square',
    label: '버섯 광장',
    imageUrl: new URL('../../assets/images/stage-backgrounds/3.jpg', import.meta.url).toString(),
    focusX: 0.5,
    focusY: 0.44,
    sceneTop: 'rgba(255, 245, 221, 0.06)',
    sceneMid: 'rgba(64, 68, 126, 0.18)',
    sceneBottom: 'rgba(18, 22, 38, 0.54)',
    uiTopLeft: 'rgba(255, 206, 132, 0.22)',
    uiTopRight: 'rgba(132, 219, 255, 0.16)',
    uiBottom: 'rgba(255, 152, 88, 0.12)',
    uiStart: '#38262b',
    uiMid: '#2d2240',
    uiEnd: '#1a1b2d',
    ambientOne: 'rgba(255, 196, 118, 0.3)',
    ambientTwo: 'rgba(112, 205, 255, 0.24)',
    ambientThree: 'rgba(255, 149, 119, 0.22)',
  },
  'abyss-corridor': {
    id: 'abyss-corridor',
    label: '심해 수로',
    imageUrl: new URL('../../assets/images/stage-backgrounds/4.jpg', import.meta.url).toString(),
    focusX: 0.5,
    focusY: 0.48,
    sceneTop: 'rgba(208, 255, 252, 0.08)',
    sceneMid: 'rgba(24, 88, 124, 0.22)',
    sceneBottom: 'rgba(5, 20, 38, 0.6)',
    uiTopLeft: 'rgba(156, 244, 255, 0.2)',
    uiTopRight: 'rgba(103, 216, 255, 0.18)',
    uiBottom: 'rgba(58, 193, 255, 0.12)',
    uiStart: '#102536',
    uiMid: '#13364d',
    uiEnd: '#091a29',
    ambientOne: 'rgba(126, 244, 255, 0.26)',
    ambientTwo: 'rgba(87, 212, 255, 0.24)',
    ambientThree: 'rgba(173, 255, 225, 0.18)',
  },
  'aurora-village': {
    id: 'aurora-village',
    label: '오로라 설원',
    imageUrl: new URL('../../assets/images/stage-backgrounds/5.jpg', import.meta.url).toString(),
    focusX: 0.48,
    focusY: 0.42,
    sceneTop: 'rgba(220, 255, 247, 0.08)',
    sceneMid: 'rgba(39, 57, 99, 0.22)',
    sceneBottom: 'rgba(10, 18, 35, 0.58)',
    uiTopLeft: 'rgba(150, 255, 232, 0.2)',
    uiTopRight: 'rgba(191, 161, 255, 0.16)',
    uiBottom: 'rgba(223, 246, 255, 0.12)',
    uiStart: '#162235',
    uiMid: '#1f2442',
    uiEnd: '#101828',
    ambientOne: 'rgba(126, 255, 225, 0.24)',
    ambientTwo: 'rgba(184, 153, 255, 0.22)',
    ambientThree: 'rgba(225, 247, 255, 0.22)',
  },
  'moon-market': {
    id: 'moon-market',
    label: '월야 포장마차',
    imageUrl: new URL('../../assets/images/stage-backgrounds/6.jpg', import.meta.url).toString(),
    focusX: 0.52,
    focusY: 0.42,
    sceneTop: 'rgba(255, 221, 158, 0.05)',
    sceneMid: 'rgba(46, 35, 74, 0.24)',
    sceneBottom: 'rgba(9, 9, 22, 0.62)',
    uiTopLeft: 'rgba(255, 178, 100, 0.22)',
    uiTopRight: 'rgba(255, 235, 189, 0.14)',
    uiBottom: 'rgba(255, 129, 72, 0.12)',
    uiStart: '#2c1d30',
    uiMid: '#241a2d',
    uiEnd: '#15131f',
    ambientOne: 'rgba(255, 170, 87, 0.28)',
    ambientTwo: 'rgba(255, 236, 177, 0.18)',
    ambientThree: 'rgba(255, 120, 79, 0.2)',
  },
  'star-palace': {
    id: 'star-palace',
    label: '별궁 첨탑',
    imageUrl: new URL('../../assets/images/stage-backgrounds/7.jpg', import.meta.url).toString(),
    focusX: 0.54,
    focusY: 0.42,
    sceneTop: 'rgba(174, 255, 249, 0.08)',
    sceneMid: 'rgba(42, 45, 104, 0.2)',
    sceneBottom: 'rgba(13, 10, 33, 0.56)',
    uiTopLeft: 'rgba(146, 255, 236, 0.22)',
    uiTopRight: 'rgba(255, 247, 193, 0.14)',
    uiBottom: 'rgba(186, 160, 255, 0.12)',
    uiStart: '#1f1f3c',
    uiMid: '#252a4e',
    uiEnd: '#151628',
    ambientOne: 'rgba(120, 245, 226, 0.24)',
    ambientTwo: 'rgba(255, 234, 160, 0.18)',
    ambientThree: 'rgba(201, 175, 255, 0.22)',
  },
  'harvest-terrace': {
    id: 'harvest-terrace',
    label: '건초 언덕',
    imageUrl: new URL('../../assets/images/stage-backgrounds/8.jpg', import.meta.url).toString(),
    focusX: 0.5,
    focusY: 0.44,
    sceneTop: 'rgba(176, 222, 255, 0.06)',
    sceneMid: 'rgba(54, 102, 78, 0.14)',
    sceneBottom: 'rgba(26, 38, 20, 0.54)',
    uiTopLeft: 'rgba(133, 206, 255, 0.22)',
    uiTopRight: 'rgba(255, 223, 120, 0.14)',
    uiBottom: 'rgba(141, 230, 132, 0.12)',
    uiStart: '#223229',
    uiMid: '#1e372b',
    uiEnd: '#142117',
    ambientOne: 'rgba(120, 204, 255, 0.24)',
    ambientTwo: 'rgba(255, 218, 103, 0.22)',
    ambientThree: 'rgba(142, 235, 128, 0.22)',
  },
};

const stageBackdropOrder: StageBackdropId[] = [
  'sakura-village',
  'sky-sanctum',
  'mushroom-square',
  'abyss-corridor',
  'aurora-village',
  'moon-market',
  'star-palace',
  'harvest-terrace',
];

export function getStageBackdrop(index: number): StageBackdropId {
  return stageBackdropOrder[((index % stageBackdropOrder.length) + stageBackdropOrder.length) % stageBackdropOrder.length];
}
