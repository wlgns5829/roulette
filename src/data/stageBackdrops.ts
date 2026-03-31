export type StageBackdropId = 'lagoon' | 'sunset' | 'midnight' | 'garden';

export type StageBackdropPalette = {
  id: StageBackdropId;
  label: string;
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
  lagoon: {
    id: 'lagoon',
    label: 'Blue Lagoon',
    uiTopLeft: 'rgba(255, 183, 120, 0.18)',
    uiTopRight: 'rgba(117, 213, 255, 0.14)',
    uiBottom: 'rgba(255, 170, 214, 0.1)',
    uiStart: '#2e1d31',
    uiMid: '#21182d',
    uiEnd: '#181522',
    ambientOne: 'rgba(255, 181, 118, 0.32)',
    ambientTwo: 'rgba(105, 209, 255, 0.28)',
    ambientThree: 'rgba(255, 171, 218, 0.24)',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset Run',
    uiTopLeft: 'rgba(255, 190, 120, 0.22)',
    uiTopRight: 'rgba(255, 121, 146, 0.16)',
    uiBottom: 'rgba(167, 139, 250, 0.14)',
    uiStart: '#3c1f28',
    uiMid: '#4e2240',
    uiEnd: '#25162a',
    ambientOne: 'rgba(255, 178, 112, 0.34)',
    ambientTwo: 'rgba(252, 129, 129, 0.3)',
    ambientThree: 'rgba(196, 152, 255, 0.26)',
  },
  midnight: {
    id: 'midnight',
    label: 'Neon Circuit',
    uiTopLeft: 'rgba(34, 211, 238, 0.18)',
    uiTopRight: 'rgba(244, 114, 182, 0.14)',
    uiBottom: 'rgba(96, 165, 250, 0.12)',
    uiStart: '#0b1220',
    uiMid: '#13182f',
    uiEnd: '#090d18',
    ambientOne: 'rgba(56, 189, 248, 0.26)',
    ambientTwo: 'rgba(168, 85, 247, 0.24)',
    ambientThree: 'rgba(244, 114, 182, 0.24)',
  },
  garden: {
    id: 'garden',
    label: 'Garden Glide',
    uiTopLeft: 'rgba(251, 191, 36, 0.18)',
    uiTopRight: 'rgba(74, 222, 128, 0.16)',
    uiBottom: 'rgba(125, 211, 252, 0.12)',
    uiStart: '#1f2e22',
    uiMid: '#183329',
    uiEnd: '#101c16',
    ambientOne: 'rgba(250, 204, 21, 0.28)',
    ambientTwo: 'rgba(74, 222, 128, 0.28)',
    ambientThree: 'rgba(125, 211, 252, 0.24)',
  },
};

const stageBackdropOrder: StageBackdropId[] = ['lagoon', 'sunset', 'midnight', 'garden'];

export function getStageBackdrop(index: number): StageBackdropId {
  const bucket = Math.max(0, Math.floor(index / 5));
  return stageBackdropOrder[Math.min(bucket, stageBackdropOrder.length - 1)];
}
