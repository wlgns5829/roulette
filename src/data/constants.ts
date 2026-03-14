import type { ColorTheme } from '../types/ColorTheme';

export const initialZoom = 30;
export const canvasWidth = 1600;
export const canvasHeight = 900;
export const zoomThreshold = 5;
export const STUCK_DELAY = 5000;

export enum Skills {
  None,
  Impact,
}

export const DefaultEntityColor = {
  box: 'cyan',
  circle: 'yellow',
  polyline: 'white',
} as const;

export const DefaultBloomColor = {
  box: 'cyan',
  circle: 'yellow',
  polyline: 'cyan',
};

export const Themes: Record<string, ColorTheme> = {
  light: {
    background: '#fff7ed',
    marbleLightness: 50,
    marbleWinningBorder: 'black',
    skillColor: '#f97316',
    coolTimeIndicator: '#fb7185',
    entity: {
      box: {
        fill: '#8bd3dd',
        outline: '#2f6f8a',
        bloom: '#8bd3dd',
        bloomRadius: 0,
      },
      circle: {
        fill: '#ffe7ba',
        outline: '#f59e0b',
        bloom: '#ffd166',
        bloomRadius: 0,
      },
      polyline: {
        fill: '#fffdf7',
        outline: '#7c4a24',
        bloom: '#ffe6a7',
        bloomRadius: 0,
      },
    },
    rankStroke: 'black',
    minimapBackground: '#fefefe',
    minimapViewport: '#6699cc',

    winnerBackground: 'rgba(255, 255, 255, 0.5)',
    winnerOutline: 'black',
    winnerText: '#cccccc',
  },
  dark: {
    background: '#1f1a2d',
    marbleLightness: 75,
    marbleWinningBorder: 'white',
    skillColor: '#ffe4a3',
    coolTimeIndicator: '#fb7185',
    entity: {
      box: {
        fill: '#82d8de',
        outline: '#82d8de',
        bloom: '#82d8de',
        bloomRadius: 15,
      },
      circle: {
        fill: '#ffe3a6',
        outline: '#ffd166',
        bloom: '#ffd166',
        bloomRadius: 15,
      },
      polyline: {
        fill: '#fff8f1',
        outline: '#fff8f1',
        bloom: '#ffd7a5',
        bloomRadius: 15,
      },
    },
    rankStroke: '',
    minimapBackground: '#333333',
    minimapViewport: 'white',
    winnerBackground: 'rgba(0, 0, 0, 0.5)',
    winnerOutline: 'black',
    winnerText: 'white',
  },
};
