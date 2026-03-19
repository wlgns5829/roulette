import type { LunchEventId } from './types/RoundEvent.type';

type ToneTarget = 'bgm' | 'sfx';

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  release?: number;
  pan?: number;
  filter?: number;
  q?: number;
  detune?: number;
};

const bpm = 114;
const stepLength = 60 / bpm / 2;
const scheduleAheadTime = 0.18;
const schedulerInterval = 80;
const enabledMasterGain = 1.48;
const defaultBgmGain = 0.5;
const duckedBgmGain = 0.1;

type BgmTrack = {
  bassPatterns: number[][];
  chordPatterns: number[][];
  chordIntervals: number[];
  arpPatterns: number[][];
  pulsePattern: number[];
  padRoots: [number, number];
  kickStartFreq: number;
  kickEndFreq: number;
  bassGain: number;
  subGain: number;
  chordGain: number;
  pulseGain: number;
  arpGain: number;
  arpAccentGain: number;
  bassFilter: number;
  subFilter: number;
  chordFilter: number;
  pulseFilter: number;
  arpFilter: number;
  arpAccentFilter: number;
  hatGain: number;
  offHatGain: number;
};

function midiToFreq(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

const bgmTracks: BgmTrack[] = [
  {
    bassPatterns: [
      [45, -1, 45, 45, 50, -1, 45, -1, 52, -1, 50, 50, 54, -1, 52, -1],
      [45, -1, 47, 50, 52, -1, 50, -1, 54, -1, 52, 50, 57, -1, 54, -1],
      [43, -1, 43, 47, 50, -1, 47, -1, 52, -1, 50, 47, 55, -1, 52, -1],
      [45, -1, 50, 52, 54, -1, 57, -1, 59, 57, 54, 52, 50, -1, 47, -1],
    ],
    chordPatterns: [
      [69, -1, -1, 73, -1, -1, 76, -1, 74, -1, -1, 78, -1, -1, 81, -1],
      [69, -1, 73, -1, 76, -1, 81, -1, 71, -1, 74, -1, 78, -1, 81, -1],
      [67, -1, 71, -1, 74, -1, 79, -1, 69, -1, 73, -1, 76, -1, 81, -1],
      [69, -1, 74, -1, 78, 81, 83, -1, 86, -1, 83, 81, 78, -1, 74, -1],
    ],
    chordIntervals: [0, 4, 7],
    arpPatterns: [
      [81, 85, 88, 90, 88, 85, 88, 93, 81, 85, 88, 90, 88, 85, 84, 81],
      [81, 85, 88, 93, 88, 85, 90, 95, 83, 86, 90, 95, 90, 86, 85, 83],
      [79, 83, 86, 91, 86, 83, 88, 91, 81, 84, 88, 93, 88, 84, 83, 81],
      [84, 88, 91, 96, 91, 88, 93, 98, 86, 90, 93, 98, 93, 90, 88, 86],
    ],
    pulsePattern: [57, -1, 57, -1, 59, -1, 57, -1, 62, -1, 59, -1, 64, -1, 59, -1],
    padRoots: [57, 59],
    kickStartFreq: 146,
    kickEndFreq: 42,
    bassGain: 0.084,
    subGain: 0.052,
    chordGain: 0.03,
    pulseGain: 0.026,
    arpGain: 0.037,
    arpAccentGain: 0.022,
    bassFilter: 980,
    subFilter: 380,
    chordFilter: 2200,
    pulseFilter: 1360,
    arpFilter: 2950,
    arpAccentFilter: 3600,
    hatGain: 0.06,
    offHatGain: 0.039,
  },
  {
    bassPatterns: [
      [40, -1, 40, 45, 47, -1, 45, -1, 52, -1, 47, 45, 54, -1, 52, -1],
      [40, -1, 43, 47, 50, -1, 47, -1, 52, -1, 50, 47, 55, -1, 52, -1],
      [38, -1, 38, 43, 45, -1, 43, -1, 50, -1, 45, 43, 54, -1, 50, -1],
      [40, -1, 45, 47, 52, -1, 54, -1, 57, 54, 52, 47, 45, -1, 43, -1],
    ],
    chordPatterns: [
      [64, -1, -1, 69, -1, -1, 71, -1, 69, -1, -1, 74, -1, -1, 76, -1],
      [64, -1, 69, -1, 71, -1, 76, -1, 66, -1, 71, -1, 74, -1, 78, -1],
      [62, -1, 67, -1, 69, -1, 74, -1, 64, -1, 69, -1, 71, -1, 76, -1],
      [64, -1, 71, -1, 74, 76, 79, -1, 81, -1, 79, 76, 74, -1, 71, -1],
    ],
    chordIntervals: [0, 5, 7],
    arpPatterns: [
      [76, 81, 83, 88, 83, 81, 85, 90, 78, 83, 85, 90, 85, 83, 81, 78],
      [78, 83, 85, 90, 85, 83, 88, 92, 80, 85, 88, 92, 88, 85, 83, 80],
      [74, 79, 81, 86, 81, 79, 83, 88, 76, 81, 83, 88, 83, 81, 79, 76],
      [81, 86, 88, 93, 88, 86, 90, 95, 83, 88, 90, 95, 90, 88, 86, 83],
    ],
    pulsePattern: [52, -1, 57, -1, 59, -1, 57, -1, 61, -1, 59, -1, 64, -1, 59, -1],
    padRoots: [52, 59],
    kickStartFreq: 158,
    kickEndFreq: 46,
    bassGain: 0.082,
    subGain: 0.05,
    chordGain: 0.029,
    pulseGain: 0.025,
    arpGain: 0.039,
    arpAccentGain: 0.024,
    bassFilter: 1040,
    subFilter: 410,
    chordFilter: 2350,
    pulseFilter: 1480,
    arpFilter: 3200,
    arpAccentFilter: 3900,
    hatGain: 0.066,
    offHatGain: 0.042,
  },
  {
    bassPatterns: [
      [38, -1, 38, 41, 45, -1, 41, -1, 46, -1, 45, 41, 50, -1, 46, -1],
      [38, -1, 41, 45, 46, -1, 45, -1, 50, -1, 46, 45, 53, -1, 50, -1],
      [36, -1, 36, 40, 43, -1, 40, -1, 45, -1, 43, 40, 48, -1, 45, -1],
      [38, -1, 43, 45, 48, -1, 50, -1, 53, 50, 48, 45, 43, -1, 41, -1],
    ],
    chordPatterns: [
      [62, -1, -1, 65, -1, -1, 69, -1, 67, -1, -1, 70, -1, -1, 74, -1],
      [62, -1, 65, -1, 69, -1, 72, -1, 64, -1, 67, -1, 70, -1, 74, -1],
      [60, -1, 64, -1, 67, -1, 71, -1, 62, -1, 65, -1, 69, -1, 72, -1],
      [62, -1, 67, -1, 70, 72, 74, -1, 77, -1, 74, 72, 70, -1, 67, -1],
    ],
    chordIntervals: [0, 3, 7, 10],
    arpPatterns: [
      [74, 77, 81, 86, 81, 77, 81, 88, 76, 79, 83, 88, 83, 79, 81, 76],
      [76, 79, 83, 88, 83, 79, 83, 90, 77, 81, 84, 90, 84, 81, 83, 77],
      [72, 76, 79, 84, 79, 76, 79, 86, 74, 77, 81, 86, 81, 77, 79, 74],
      [79, 83, 86, 91, 86, 83, 86, 93, 81, 84, 88, 93, 88, 84, 86, 81],
    ],
    pulsePattern: [50, -1, 50, -1, 53, -1, 50, -1, 55, -1, 53, -1, 57, -1, 53, -1],
    padRoots: [50, 53],
    kickStartFreq: 136,
    kickEndFreq: 38,
    bassGain: 0.08,
    subGain: 0.048,
    chordGain: 0.028,
    pulseGain: 0.024,
    arpGain: 0.036,
    arpAccentGain: 0.022,
    bassFilter: 860,
    subFilter: 330,
    chordFilter: 2050,
    pulseFilter: 1280,
    arpFilter: 2780,
    arpAccentFilter: 3480,
    hatGain: 0.054,
    offHatGain: 0.036,
  },
  {
    bassPatterns: [
      [47, -1, 47, 47, 52, -1, 49, -1, 54, -1, 52, 49, 56, -1, 54, -1],
      [47, -1, 49, 52, 54, -1, 52, -1, 56, -1, 54, 52, 59, -1, 56, -1],
      [45, -1, 45, 49, 52, -1, 49, -1, 54, -1, 52, 49, 57, -1, 54, -1],
      [47, -1, 52, 54, 56, -1, 59, -1, 61, 59, 56, 54, 52, -1, 49, -1],
    ],
    chordPatterns: [
      [71, -1, -1, 75, -1, -1, 78, -1, 76, -1, -1, 80, -1, -1, 83, -1],
      [71, -1, 75, -1, 78, -1, 83, -1, 73, -1, 76, -1, 80, -1, 83, -1],
      [69, -1, 73, -1, 76, -1, 81, -1, 71, -1, 75, -1, 78, -1, 83, -1],
      [71, -1, 76, -1, 80, 83, 85, -1, 88, -1, 85, 83, 80, -1, 76, -1],
    ],
    chordIntervals: [0, 4, 7, 12],
    arpPatterns: [
      [83, 87, 90, 95, 90, 87, 90, 97, 85, 88, 92, 97, 92, 88, 90, 85],
      [83, 88, 92, 97, 92, 88, 93, 99, 85, 90, 93, 99, 93, 90, 88, 85],
      [81, 85, 88, 93, 88, 85, 90, 95, 83, 87, 90, 95, 90, 87, 85, 83],
      [85, 90, 93, 99, 93, 90, 95, 100, 88, 92, 95, 100, 95, 92, 90, 88],
    ],
    pulsePattern: [59, -1, 59, -1, 61, -1, 59, -1, 64, -1, 61, -1, 66, -1, 61, -1],
    padRoots: [59, 61],
    kickStartFreq: 150,
    kickEndFreq: 44,
    bassGain: 0.086,
    subGain: 0.055,
    chordGain: 0.031,
    pulseGain: 0.028,
    arpGain: 0.041,
    arpAccentGain: 0.026,
    bassFilter: 1120,
    subFilter: 420,
    chordFilter: 2480,
    pulseFilter: 1560,
    arpFilter: 3320,
    arpAccentFilter: 4100,
    hatGain: 0.068,
    offHatGain: 0.044,
  },
];

export class AudioEngine {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _bgmGain: GainNode | null = null;
  private _sfxGain: GainNode | null = null;
  private _noiseBuffer: AudioBuffer | null = null;
  private _schedulerId: number | null = null;
  private _nextStepTime = 0;
  private _step = 0;
  private _bar = 0;
  private _completedBars = 0;
  private _bgmTrackIndex = -1;
  private _isEnabled = true;
  private _hasStartedBgm = false;

  public setEnabled(value: boolean) {
    this._isEnabled = value;
    if (!this._ctx || !this._masterGain) return;

    if (value) {
      this._ctx.resume();
      this._masterGain.gain.setTargetAtTime(enabledMasterGain, this._ctx.currentTime, 0.04);
      if (this._hasStartedBgm) {
        this.startBgm();
      }
      return;
    }

    this._masterGain.gain.setTargetAtTime(0.0001, this._ctx.currentTime, 0.04);
    this.stopBgm();
  }

  public async unlock() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    await ctx.resume();
    if (this._masterGain) {
      this._masterGain.gain.setTargetAtTime(this._isEnabled ? enabledMasterGain : 0.0001, ctx.currentTime, 0.04);
    }
  }

  public startBgm() {
    const ctx = this._ensureContext();
    if (!ctx || !this._isEnabled || ctx.state === 'suspended' || !this._bgmGain) return;

    this._hasStartedBgm = true;
    this._selectRandomBgmTrack();
    this._bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    this._bgmGain.gain.setTargetAtTime(defaultBgmGain, ctx.currentTime, 0.08);
    this._nextStepTime = ctx.currentTime + 0.06;
    this._step = 0;
    this._bar = 0;
    this._completedBars = 0;
    if (this._schedulerId !== null) {
      return;
    }
    this._schedulerId = window.setInterval(() => this._scheduler(), schedulerInterval);
  }

  public stopBgm() {
    if (this._ctx && this._bgmGain) {
      this._bgmGain.gain.cancelScheduledValues(this._ctx.currentTime);
      this._bgmGain.gain.setTargetAtTime(0.0001, this._ctx.currentTime, 0.08);
    }
    if (this._schedulerId !== null) {
      window.clearInterval(this._schedulerId);
      this._schedulerId = null;
    }
    this._completedBars = 0;
  }

  public playUiClick() {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const time = ctx.currentTime + 0.01;
    this._playTone(midiToFreq(72), time, 0.08, {
      type: 'triangle',
      gain: 0.12,
      release: 0.08,
      filter: 1300,
      pan: -0.2,
    });
    this._playTone(midiToFreq(79), time + 0.05, 0.08, {
      type: 'triangle',
      gain: 0.09,
      release: 0.1,
      filter: 1500,
      pan: 0.25,
    });
  }

  public playRoundStart() {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + 0.02;
    [55, 59, 62, 67].forEach((note, index) => {
      this._playTone(midiToFreq(note), start + index * 0.08, 0.18, {
        type: 'sawtooth',
        gain: 0.11,
        attack: 0.01,
        release: 0.16,
        filter: 1400,
        pan: -0.15 + index * 0.1,
      });
    });
    this._playNoise(start + 0.18, 0.12, 0.05, 3200, 0.7);
  }

  public playSkillImpact() {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + 0.01;
    this._playKick(start, 0.08, 164, 52);
    this._playNoise(start + 0.01, 0.09, 0.05, 2400, 1.1, 'bandpass');
    [74, 79, 86].forEach((note, index) => {
      this._playTone(midiToFreq(note), start + index * 0.035, 0.12, {
        type: 'triangle',
        gain: 0.085,
        attack: 0.01,
        release: 0.1,
        filter: 1700 + index * 180,
        pan: -0.2 + index * 0.2,
      });
    });
  }

  public playRoundEvent(eventId: LunchEventId) {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const time = ctx.currentTime + 0.01;
    switch (eventId) {
      case 'coffee-spill':
        this._playTone(midiToFreq(71), time, 0.14, { type: 'square', gain: 0.08, release: 0.12, pan: -0.4 });
        this._playTone(midiToFreq(66), time + 0.07, 0.16, {
          type: 'square',
          gain: 0.1,
          release: 0.15,
          pan: 0.35,
        });
        break;
      case 'espresso-shot':
        [76, 81, 88].forEach((note, index) => {
          this._playTone(midiToFreq(note), time + index * 0.04, 0.09, {
            type: 'triangle',
            gain: 0.1,
            release: 0.08,
            filter: 1700,
            pan: -0.3 + index * 0.3,
          });
        });
        break;
      case 'meeting-call':
        this._playTone(midiToFreq(84), time, 0.08, {
          type: 'sine',
          gain: 0.1,
          release: 0.06,
          filter: 2000,
          pan: -0.2,
        });
        this._playTone(midiToFreq(79), time + 0.12, 0.08, {
          type: 'sine',
          gain: 0.1,
          release: 0.06,
          filter: 1800,
          pan: 0.2,
        });
        break;
      case 'ac-draft':
        this._playNoise(time, 0.32, 0.08, 1200, 0.4, 'highpass');
        this._playTone(midiToFreq(57), time + 0.03, 0.25, {
          type: 'triangle',
          gain: 0.08,
          release: 0.24,
          filter: 800,
        });
        break;
      case 'bean-burst':
        this._playKick(time, 0.11, 150, 42);
        this._playNoise(time + 0.04, 0.12, 0.08, 900, 1.2, 'bandpass');
        break;
      case 'bomb-burst':
        this._playKick(time, 0.14, 180, 34);
        this._playKick(time + 0.08, 0.11, 140, 28);
        this._playNoise(time + 0.01, 0.18, 0.12, 760, 1.8, 'bandpass');
        this._playNoise(time + 0.1, 0.14, 0.08, 2800, 0.9, 'highpass');
        this._playTone(midiToFreq(43), time + 0.02, 0.26, {
          type: 'sawtooth',
          gain: 0.12,
          release: 0.18,
          filter: 720,
        });
        break;
      case 'sugar-crash':
        this._playTone(midiToFreq(55), time, 0.22, {
          type: 'triangle',
          gain: 0.11,
          release: 0.26,
          filter: 700,
        });
        this._playTone(midiToFreq(50), time + 0.07, 0.26, {
          type: 'sine',
          gain: 0.1,
          release: 0.3,
          filter: 500,
        });
        break;
      case 'shark-rush':
        this._playNoise(time, 0.16, 0.06, 1400, 1.4, 'bandpass');
        [64, 69, 73].forEach((note, index) => {
          this._playTone(midiToFreq(note), time + index * 0.045, 0.1, {
            type: 'triangle',
            gain: 0.09,
            release: 0.08,
            filter: 1600 + index * 240,
            pan: -0.22 + index * 0.22,
          });
        });
        this._playTone(midiToFreq(57), time + 0.14, 0.22, {
          type: 'sawtooth',
          gain: 0.08,
          attack: 0.01,
          release: 0.14,
          filter: 900,
        });
        break;
    }
  }

  public playGoal() {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx || !this._bgmGain) return;

    const start = ctx.currentTime + 0.02;
    this._bgmGain.gain.cancelScheduledValues(start);
    this._bgmGain.gain.setTargetAtTime(duckedBgmGain, start, 0.03);
    this._bgmGain.gain.setTargetAtTime(defaultBgmGain, start + 2.2, 0.18);

    this._playKick(start, 0.18, 180, 38);
    this._playNoise(start + 0.02, 0.32, 0.1, 3800, 0.9, 'highpass');

    [60, 64, 67, 72].forEach((note, index) => {
      this._playTone(midiToFreq(note), start + index * 0.05, 0.55, {
        type: 'sawtooth',
        gain: 0.12,
        attack: 0.01,
        release: 0.45,
        filter: 1500,
        pan: -0.3 + index * 0.2,
      });
    });

    [79, 84, 88].forEach((note, index) => {
      this._playTone(midiToFreq(note), start + 0.28 + index * 0.06, 0.42, {
        type: 'triangle',
        gain: 0.1,
        attack: 0.01,
        release: 0.26,
        filter: 1800,
        pan: -0.2 + index * 0.2,
      });
    });
  }

  public playFinalApproach() {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + 0.01;
    [67, 71, 74, 79].forEach((note, index) => {
      this._playTone(midiToFreq(note), start + index * 0.05, 0.14 + index * 0.02, {
        type: 'triangle',
        gain: 0.1,
        attack: 0.01,
        release: 0.12,
        filter: 1700,
        pan: -0.2 + index * 0.14,
      });
    });
    this._playNoise(start + 0.18, 0.08, 0.04, 3200, 1.2, 'bandpass');
  }

  private _ensureContext() {
    if (this._ctx) {
      return this._ctx;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    const bgm = ctx.createGain();
    const sfx = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();

    master.gain.value = 0.0001;
    bgm.gain.value = defaultBgmGain;
    sfx.gain.value = 0.24;
    compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(3, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.2, ctx.currentTime);

    bgm.connect(master);
    sfx.connect(master);
    master.connect(compressor);
    compressor.connect(ctx.destination);

    this._ctx = ctx;
    this._masterGain = master;
    this._bgmGain = bgm;
    this._sfxGain = sfx;
    this._noiseBuffer = this._createNoiseBuffer(ctx);
    return ctx;
  }

  private _selectRandomBgmTrack() {
    if (bgmTracks.length <= 1) {
      this._bgmTrackIndex = 0;
      return;
    }

    if (this._bgmTrackIndex < 0) {
      this._bgmTrackIndex = Math.floor(Math.random() * bgmTracks.length);
      return;
    }

    let next = Math.floor(Math.random() * (bgmTracks.length - 1));
    if (next >= this._bgmTrackIndex) {
      next += 1;
    }
    this._bgmTrackIndex = next;
  }

  private _createNoiseBuffer(ctx: AudioContext) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      channel[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private _scheduler() {
    if (!this._ctx || this._ctx.state === 'suspended') {
      return;
    }

    while (this._nextStepTime < this._ctx.currentTime + scheduleAheadTime) {
      this._scheduleStep(this._step, this._bar, this._nextStepTime);
      this._nextStepTime += stepLength;
      this._step += 1;
      if (this._step >= 16) {
        this._step = 0;
        this._completedBars += 1;
        this._bar = (this._bar + 1) % 4;
        if (this._completedBars % 2 === 0) {
          this._selectRandomBgmTrack();
        }
      }
    }
  }

  private _scheduleStep(step: number, bar: number, time: number) {
    const track = bgmTracks[this._bgmTrackIndex] ?? bgmTracks[0];
    const bassPattern = track.bassPatterns[bar];
    const chordPattern = track.chordPatterns[bar];
    const arpPattern = track.arpPatterns[bar];

    if (step % 4 === 0) {
      this._playKick(time, 0.18, track.kickStartFreq, track.kickEndFreq, 'bgm');
      this._playTone(
        midiToFreq(step < 8 ? track.padRoots[0] : track.padRoots[1]),
        time,
        stepLength * 3.8,
        {
          type: 'sine',
          gain: 0.052,
          attack: 0.02,
          release: 0.4,
          filter: track.subFilter + 120,
        },
        'bgm'
      );
    }

    if (step === 4 || step === 12) {
      this._playNoise(time, 0.12, 0.046, 2100, 1.3, 'bandpass', 'bgm');
      this._playSnare(time + 0.01, 0.072, 'bgm');
    }

    if (step % 2 === 0) {
      this._playNoise(
        time + 0.008,
        0.045,
        step % 4 === 0 ? track.hatGain : track.hatGain * 0.7,
        7600,
        1.1,
        'highpass',
        'bgm'
      );
    } else if (bar >= 2) {
      this._playNoise(time + 0.01, 0.032, track.offHatGain, 9000, 0.7, 'highpass', 'bgm');
    }

    if (step === 15 && bar === 3) {
      this._playNoise(time, 0.18, 0.04, 2800, 1.8, 'bandpass', 'bgm');
    }

    const bassNote = bassPattern[step];
    if (bassNote > 0) {
      this._playTone(
        midiToFreq(bassNote),
        time,
        stepLength * 1.45,
        {
          type: 'sawtooth',
          gain: track.bassGain,
          attack: 0.01,
          release: 0.2,
          filter: track.bassFilter,
        },
        'bgm'
      );
      this._playTone(
        midiToFreq(bassNote - 12),
        time,
        stepLength * 1.2,
        {
          type: 'triangle',
          gain: track.subGain,
          attack: 0.01,
          release: 0.18,
          filter: track.subFilter,
        },
        'bgm'
      );
    }

    const chordNote = chordPattern[step];
    if (chordNote > 0) {
      track.chordIntervals.forEach((interval, index) => {
        this._playTone(
          midiToFreq(chordNote + interval),
          time + 0.01 + index * 0.008,
          stepLength * 0.72,
          {
            type: 'square',
            gain: track.chordGain,
            attack: 0.01,
            release: 0.09,
            pan: step % 8 < 4 ? -0.24 + index * 0.08 : 0.24 - index * 0.08,
            filter: track.chordFilter,
          },
          'bgm'
        );
      });
    }

    const pulseNote = track.pulsePattern[step];
    if (pulseNote > 0 && step % 4 !== 0) {
      this._playTone(
        midiToFreq(pulseNote),
        time + 0.012,
        stepLength * 0.56,
        {
          type: 'triangle',
          gain: track.pulseGain,
          attack: 0.008,
          release: 0.08,
          pan: step % 2 === 0 ? -0.14 : 0.14,
          filter: track.pulseFilter,
        },
        'bgm'
      );
    }

    const arpNote = arpPattern[step];
    if (arpNote > 0) {
      this._playTone(
        midiToFreq(arpNote),
        time + 0.03,
        stepLength * (bar === 3 ? 0.48 : 0.4),
        {
          type: step % 4 === 3 ? 'sawtooth' : 'triangle',
          gain: bar >= 2 ? track.arpGain + 0.004 : track.arpGain,
          attack: 0.005,
          release: 0.07,
          pan: step % 2 === 0 ? -0.3 : 0.3,
          filter: bar >= 2 ? track.arpFilter + 260 : track.arpFilter,
        },
        'bgm'
      );
    }

    if (arpNote > 0 && bar >= 1 && step % 8 === 6) {
      this._playTone(
        midiToFreq(arpNote + 12),
        time + 0.045,
        stepLength * 0.26,
        {
          type: 'triangle',
          gain: track.arpAccentGain,
          attack: 0.005,
          release: 0.06,
          pan: step % 2 === 0 ? 0.22 : -0.22,
          filter: track.arpAccentFilter,
        },
        'bgm'
      );
    }
  }

  private _playSnare(time: number, gainAmount: number, target: ToneTarget = 'sfx') {
    this._playNoise(time, 0.09, gainAmount, 2400, 0.9, 'bandpass', target);
    this._playTone(
      midiToFreq(50),
      time,
      0.06,
      {
        type: 'triangle',
        gain: gainAmount * 0.55,
        attack: 0.001,
        release: 0.08,
        filter: 950,
      },
      target
    );
  }

  private _playKick(time: number, gainAmount: number, startFreq: number, endFreq: number, target: ToneTarget = 'sfx') {
    const ctx = this._ctx;
    const destination = this._getTargetGain(target);
    if (!ctx || !destination) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.16);

    gain.gain.setValueAtTime(gainAmount, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private _playNoise(
    time: number,
    duration: number,
    gainAmount: number,
    filterFrequency: number,
    q: number,
    filterType: BiquadFilterType = 'bandpass',
    target: ToneTarget = 'sfx'
  ) {
    const ctx = this._ctx;
    const destination = this._getTargetGain(target);
    if (!ctx || !destination || !this._noiseBuffer) return;

    const source = ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFrequency, time);
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainAmount, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(time);
    source.stop(time + duration);
  }

  private _playTone(
    freq: number,
    time: number,
    duration: number,
    options: ToneOptions = {},
    target: ToneTarget = 'sfx'
  ) {
    const ctx = this._ctx;
    const destination = this._getTargetGain(target);
    if (!ctx || !destination) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner();

    const {
      type = 'triangle',
      gain: peakGain = 0.08,
      attack = 0.01,
      release = 0.12,
      pan = 0,
      filter: filterFreq = 1200,
      q = 0.8,
      detune = 0,
    } = options;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.value = detune;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.Q.value = q;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

    panner.pan.setValueAtTime(pan, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(destination);

    osc.start(time);
    osc.stop(time + duration + release + 0.03);
  }

  private _getTargetGain(target: ToneTarget) {
    if (target === 'bgm') {
      return this._bgmGain;
    }
    return this._sfxGain;
  }
}
