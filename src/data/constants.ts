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
    background: '#eadfcd',
    marbleLightness: 50,
    marbleWinningBorder: 'black',
    skillColor: '#f97316',
    coolTimeIndicator: '#fb7185',
    entity: {
      box: {
        fill: '#74bcc8',
        outline: '#2c647b',
        bloom: '#74bcc8',
        bloomRadius: 0,
      },
      circle: {
        fill: '#f5d79a',
        outline: '#d68f22',
        bloom: '#f1c15f',
        bloomRadius: 0,
      },
      polyline: {
        fill: '#f5ebdb',
        outline: '#714722',
        bloom: '#f0cc89',
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
    background: '#181423',
    marbleLightness: 75,
    marbleWinningBorder: 'white',
    skillColor: '#ffe4a3',
    coolTimeIndicator: '#fb7185',
    entity: {
      box: {
        fill: '#64b4bf',
        outline: '#6ec0ca',
        bloom: '#64b4bf',
        bloomRadius: 15,
      },
      circle: {
        fill: '#e9c27a',
        outline: '#efc35c',
        bloom: '#efc35c',
        bloomRadius: 15,
      },
      polyline: {
        fill: '#f2e4d6',
        outline: '#f2e4d6',
        bloom: '#eeb97f',
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
