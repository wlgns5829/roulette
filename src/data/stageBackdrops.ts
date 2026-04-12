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
  uiPhotoScale: number;
  scenePhotoScale: number;
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

const sunlitFairway = new URL('../../assets/images/stage-backgrounds/sunlit-fairway.svg', import.meta.url).toString();
const crystalLake = new URL('../../assets/images/stage-backgrounds/crystal-lake.svg', import.meta.url).toString();
const goldenSeaCliffs = new URL('../../assets/images/stage-backgrounds/golden-sea-cliffs.svg', import.meta.url).toString();
const midnightSkyline = new URL('../../assets/images/stage-backgrounds/midnight-skyline.svg', import.meta.url).toString();
const gothicSpires = new URL('../../assets/images/stage-backgrounds/gothic-spires.svg', import.meta.url).toString();
const snowRailway = new URL('../../assets/images/stage-backgrounds/snow-railway.svg', import.meta.url).toString();
const tropicalShore = new URL('../../assets/images/stage-backgrounds/tropical-shore.svg', import.meta.url).toString();

export const stageBackdrops: Record<StageBackdropId, StageBackdropPalette> = {
  'sakura-village': {
    id: 'sakura-village',
    label: '햇살 초원',
    imageUrl: sunlitFairway,
    focusX: 0.36,
    focusY: 0.4,
    uiPhotoScale: 1.44,
    scenePhotoScale: 1.3,
    sceneTop: 'rgba(242, 247, 255, 0.06)',
    sceneMid: 'rgba(83, 129, 68, 0.16)',
    sceneBottom: 'rgba(16, 34, 18, 0.5)',
    uiTopLeft: 'rgba(255, 245, 183, 0.22)',
    uiTopRight: 'rgba(145, 214, 255, 0.18)',
    uiBottom: 'rgba(133, 203, 107, 0.14)',
    uiStart: '#24401d',
    uiMid: '#1d3521',
    uiEnd: '#142315',
    ambientOne: 'rgba(255, 239, 156, 0.26)',
    ambientTwo: 'rgba(122, 221, 255, 0.2)',
    ambientThree: 'rgba(170, 224, 118, 0.22)',
  },
  'sky-sanctum': {
    id: 'sky-sanctum',
    label: '거울 호수',
    imageUrl: crystalLake,
    focusX: 0.5,
    focusY: 0.42,
    uiPhotoScale: 1.42,
    scenePhotoScale: 1.26,
    sceneTop: 'rgba(229, 248, 255, 0.06)',
    sceneMid: 'rgba(39, 93, 132, 0.18)',
    sceneBottom: 'rgba(10, 27, 45, 0.52)',
    uiTopLeft: 'rgba(186, 230, 255, 0.22)',
    uiTopRight: 'rgba(231, 245, 255, 0.18)',
    uiBottom: 'rgba(100, 177, 219, 0.14)',
    uiStart: '#17334a',
    uiMid: '#142a3b',
    uiEnd: '#0d1b27',
    ambientOne: 'rgba(187, 233, 255, 0.24)',
    ambientTwo: 'rgba(117, 194, 255, 0.2)',
    ambientThree: 'rgba(221, 248, 255, 0.22)',
  },
  'mushroom-square': {
    id: 'mushroom-square',
    label: '황혼 절벽해안',
    imageUrl: goldenSeaCliffs,
    focusX: 0.56,
    focusY: 0.42,
    uiPhotoScale: 1.48,
    scenePhotoScale: 1.34,
    sceneTop: 'rgba(255, 230, 194, 0.08)',
    sceneMid: 'rgba(112, 60, 33, 0.18)',
    sceneBottom: 'rgba(19, 15, 27, 0.56)',
    uiTopLeft: 'rgba(255, 203, 128, 0.24)',
    uiTopRight: 'rgba(255, 239, 191, 0.16)',
    uiBottom: 'rgba(230, 156, 88, 0.14)',
    uiStart: '#35221f',
    uiMid: '#261b22',
    uiEnd: '#17141b',
    ambientOne: 'rgba(255, 208, 116, 0.28)',
    ambientTwo: 'rgba(255, 165, 105, 0.2)',
    ambientThree: 'rgba(255, 241, 201, 0.18)',
  },
  'abyss-corridor': {
    id: 'abyss-corridor',
    label: '푸른 야경도시',
    imageUrl: midnightSkyline,
    focusX: 0.5,
    focusY: 0.34,
    uiPhotoScale: 1.52,
    scenePhotoScale: 1.38,
    sceneTop: 'rgba(143, 204, 255, 0.05)',
    sceneMid: 'rgba(30, 57, 114, 0.2)',
    sceneBottom: 'rgba(7, 12, 26, 0.62)',
    uiTopLeft: 'rgba(98, 178, 255, 0.18)',
    uiTopRight: 'rgba(207, 235, 255, 0.12)',
    uiBottom: 'rgba(58, 109, 214, 0.14)',
    uiStart: '#111d39',
    uiMid: '#10172d',
    uiEnd: '#080d18',
    ambientOne: 'rgba(121, 193, 255, 0.24)',
    ambientTwo: 'rgba(193, 232, 255, 0.16)',
    ambientThree: 'rgba(74, 128, 255, 0.22)',
  },
  'aurora-village': {
    id: 'aurora-village',
    label: '고딕 첨탑광장',
    imageUrl: gothicSpires,
    focusX: 0.52,
    focusY: 0.34,
    uiPhotoScale: 1.5,
    scenePhotoScale: 1.34,
    sceneTop: 'rgba(211, 228, 255, 0.06)',
    sceneMid: 'rgba(60, 72, 97, 0.18)',
    sceneBottom: 'rgba(14, 18, 29, 0.56)',
    uiTopLeft: 'rgba(134, 182, 255, 0.16)',
    uiTopRight: 'rgba(225, 236, 255, 0.16)',
    uiBottom: 'rgba(106, 126, 160, 0.12)',
    uiStart: '#232b3a',
    uiMid: '#1b2130',
    uiEnd: '#10141f',
    ambientOne: 'rgba(175, 202, 255, 0.22)',
    ambientTwo: 'rgba(214, 227, 255, 0.18)',
    ambientThree: 'rgba(113, 128, 166, 0.22)',
  },
  'moon-market': {
    id: 'moon-market',
    label: '설산 열차길',
    imageUrl: snowRailway,
    focusX: 0.5,
    focusY: 0.38,
    uiPhotoScale: 1.46,
    scenePhotoScale: 1.3,
    sceneTop: 'rgba(244, 248, 255, 0.08)',
    sceneMid: 'rgba(90, 118, 158, 0.16)',
    sceneBottom: 'rgba(13, 23, 43, 0.54)',
    uiTopLeft: 'rgba(222, 237, 255, 0.22)',
    uiTopRight: 'rgba(255, 196, 156, 0.14)',
    uiBottom: 'rgba(176, 212, 255, 0.14)',
    uiStart: '#20324b',
    uiMid: '#182739',
    uiEnd: '#0e1622',
    ambientOne: 'rgba(230, 240, 255, 0.22)',
    ambientTwo: 'rgba(255, 164, 110, 0.18)',
    ambientThree: 'rgba(154, 196, 255, 0.24)',
  },
  'star-palace': {
    id: 'star-palace',
    label: '에메랄드 해변',
    imageUrl: tropicalShore,
    focusX: 0.42,
    focusY: 0.42,
    uiPhotoScale: 1.44,
    scenePhotoScale: 1.28,
    sceneTop: 'rgba(198, 247, 255, 0.08)',
    sceneMid: 'rgba(30, 111, 148, 0.18)',
    sceneBottom: 'rgba(7, 29, 44, 0.56)',
    uiTopLeft: 'rgba(126, 227, 255, 0.22)',
    uiTopRight: 'rgba(255, 241, 196, 0.14)',
    uiBottom: 'rgba(122, 216, 201, 0.12)',
    uiStart: '#124058',
    uiMid: '#16344a',
    uiEnd: '#0d1f2e',
    ambientOne: 'rgba(118, 236, 255, 0.24)',
    ambientTwo: 'rgba(255, 240, 180, 0.18)',
    ambientThree: 'rgba(99, 226, 193, 0.22)',
  },
  'harvest-terrace': {
    id: 'harvest-terrace',
    label: '목초지 언덕',
    imageUrl: sunlitFairway,
    focusX: 0.66,
    focusY: 0.54,
    uiPhotoScale: 1.58,
    scenePhotoScale: 1.4,
    sceneTop: 'rgba(237, 245, 255, 0.06)',
    sceneMid: 'rgba(91, 135, 63, 0.16)',
    sceneBottom: 'rgba(17, 31, 15, 0.5)',
    uiTopLeft: 'rgba(195, 235, 140, 0.2)',
    uiTopRight: 'rgba(183, 221, 255, 0.16)',
    uiBottom: 'rgba(209, 199, 127, 0.12)',
    uiStart: '#2b3e1d',
    uiMid: '#21321e',
    uiEnd: '#172214',
    ambientOne: 'rgba(200, 229, 134, 0.22)',
    ambientTwo: 'rgba(146, 218, 255, 0.18)',
    ambientThree: 'rgba(239, 216, 134, 0.18)',
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
