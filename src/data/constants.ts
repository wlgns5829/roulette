import type { ColorTheme } from '../types/ColorTheme';

export const initialZoom = 30;
export const canvasWidth = 1600;
export const canvasHeight = 900;
export const zoomThreshold = 5;
export const STUCK_DELAY = 2200;

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
    background: '#d7c8b1',
    marbleLightness: 50,
    marbleWinningBorder: 'black',
    skillColor: '#f97316',
    coolTimeIndicator: '#fb7185',
    entity: {
      box: {
        fill: '#66adb8',
        outline: '#75afbf',
        bloom: '#66adb8',
        bloomRadius: 0,
      },
      circle: {
        fill: '#e8c982',
        outline: '#dcb35b',
        bloom: '#ddaf53',
        bloomRadius: 0,
      },
      polyline: {
        fill: '#e6d9c6',
        outline: '#d3bb90',
        bloom: '#ddb774',
        bloomRadius: 0,
      },
    },
    rankStroke: '',
    minimapBackground: '#ece0cf',
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
