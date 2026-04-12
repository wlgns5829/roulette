import type { MarbleStyle } from './types/MarbleStyle.type';

class Options {
  useSkills: boolean = true;
  winningRank: number = 0;
  autoRecording: boolean = false;
  darkMode: boolean = false;
  audioEnabled: boolean = true;
  marbleStyle: MarbleStyle = 'boss';
}

const options = new Options();
export default options;
