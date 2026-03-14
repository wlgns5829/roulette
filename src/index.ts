import './localization';
import { attachApp } from './app';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import { Roulette } from './roulette';

registerServiceWorker();

const roulette = new Roulette();

(window as any).roulette = roulette;
(window as any).options = options;

attachApp(roulette);
