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

const bpm = 92;
const stepLength = 60 / bpm / 2;
const scheduleAheadTime = 0.18;
const schedulerInterval = 80;
const enabledMasterGain = 1.52;
const defaultBgmGain = 0.9;
const duckedBgmGain = 0.24;

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
      [36, -1, -1, 43, -1, -1, 40, -1, 43, -1, -1, 48, -1, 45, -1, -1],
      [36, -1, -1, 40, -1, -1, 43, -1, 45, -1, -1, 50, -1, 47, -1, -1],
      [33, -1, -1, 40, -1, -1, 38, -1, 41, -1, -1, 48, -1, 45, -1, -1],
      [36, -1, -1, 43, -1, -1, 45, -1, 47, -1, -1, 52, -1, 48, -1, -1],
    ],
    chordPatterns: [
      [60, -1, -1, -1, 64, -1, -1, -1, 67, -1, -1, -1, 71, -1, -1, -1],
      [60, -1, -1, -1, 64, -1, -1, -1, 67, -1, -1, -1, 72, -1, -1, -1],
      [57, -1, -1, -1, 60, -1, -1, -1, 64, -1, -1, -1, 69, -1, -1, -1],
      [60, -1, -1, -1, 65, -1, -1, -1, 69, -1, -1, -1, 72, -1, -1, -1],
    ],
    chordIntervals: [0, 4, 7, 12],
    arpPatterns: [
      [79, -1, 83, -1, 86, -1, 83, -1, 88, -1, 86, -1, 83, -1, 79, -1],
      [79, -1, 84, -1, 88, -1, 84, -1, 91, -1, 88, -1, 84, -1, 79, -1],
      [76, -1, 81, -1, 84, -1, 81, -1, 88, -1, 84, -1, 81, -1, 76, -1],
      [79, -1, 84, -1, 88, -1, 91, -1, 93, -1, 91, -1, 88, -1, 84, -1],
    ],
    pulsePattern: [55, -1, -1, -1, 57, -1, -1, -1, 59, -1, -1, -1, 60, -1, -1, -1],
    padRoots: [48, 52],
    kickStartFreq: 96,
    kickEndFreq: 30,
    bassGain: 0.05,
    subGain: 0.035,
    chordGain: 0.028,
    pulseGain: 0.018,
    arpGain: 0.026,
    arpAccentGain: 0.018,
    bassFilter: 540,
    subFilter: 240,
    chordFilter: 1240,
    pulseFilter: 980,
    arpFilter: 2140,
    arpAccentFilter: 2840,
    hatGain: 0.014,
    offHatGain: 0.01,
  },
  {
    bassPatterns: [
      [38, -1, -1, 45, -1, -1, 42, -1, 45, -1, -1, 50, -1, 47, -1, -1],
      [38, -1, -1, 42, -1, -1, 45, -1, 47, -1, -1, 52, -1, 50, -1, -1],
      [35, -1, -1, 42, -1, -1, 40, -1, 43, -1, -1, 50, -1, 47, -1, -1],
      [38, -1, -1, 45, -1, -1, 47, -1, 50, -1, -1, 54, -1, 52, -1, -1],
    ],
    chordPatterns: [
      [62, -1, -1, -1, 66, -1, -1, -1, 69, -1, -1, -1, 73, -1, -1, -1],
      [62, -1, -1, -1, 66, -1, -1, -1, 69, -1, -1, -1, 74, -1, -1, -1],
      [59, -1, -1, -1, 62, -1, -1, -1, 66, -1, -1, -1, 71, -1, -1, -1],
      [62, -1, -1, -1, 67, -1, -1, -1, 71, -1, -1, -1, 74, -1, -1, -1],
    ],
    chordIntervals: [0, 4, 7, 12],
    arpPatterns: [
      [81, -1, 85, -1, 88, -1, 85, -1, 90, -1, 88, -1, 85, -1, 81, -1],
      [81, -1, 86, -1, 90, -1, 86, -1, 93, -1, 90, -1, 86, -1, 81, -1],
      [78, -1, 83, -1, 86, -1, 83, -1, 90, -1, 86, -1, 83, -1, 78, -1],
      [83, -1, 88, -1, 91, -1, 88, -1, 95, -1, 91, -1, 88, -1, 83, -1],
    ],
    pulsePattern: [57, -1, -1, -1, 59, -1, -1, -1, 61, -1, -1, -1, 62, -1, -1, -1],
    padRoots: [50, 54],
    kickStartFreq: 104,
    kickEndFreq: 32,
    bassGain: 0.052,
    subGain: 0.036,
    chordGain: 0.03,
    pulseGain: 0.019,
    arpGain: 0.028,
    arpAccentGain: 0.019,
    bassFilter: 580,
    subFilter: 250,
    chordFilter: 1320,
    pulseFilter: 1040,
    arpFilter: 2260,
    arpAccentFilter: 2960,
    hatGain: 0.016,
    offHatGain: 0.011,
  },
  {
    bassPatterns: [
      [41, -1, -1, 48, -1, -1, 45, -1, 48, -1, -1, 53, -1, 50, -1, -1],
      [41, -1, -1, 45, -1, -1, 48, -1, 50, -1, -1, 55, -1, 53, -1, -1],
      [38, -1, -1, 45, -1, -1, 43, -1, 46, -1, -1, 53, -1, 50, -1, -1],
      [41, -1, -1, 48, -1, -1, 50, -1, 53, -1, -1, 57, -1, 55, -1, -1],
    ],
    chordPatterns: [
      [65, -1, -1, -1, 69, -1, -1, -1, 72, -1, -1, -1, 76, -1, -1, -1],
      [65, -1, -1, -1, 69, -1, -1, -1, 72, -1, -1, -1, 77, -1, -1, -1],
      [62, -1, -1, -1, 65, -1, -1, -1, 69, -1, -1, -1, 74, -1, -1, -1],
      [65, -1, -1, -1, 71, -1, -1, -1, 74, -1, -1, -1, 77, -1, -1, -1],
    ],
    chordIntervals: [0, 4, 7, 11],
    arpPatterns: [
      [84, -1, 88, -1, 91, -1, 88, -1, 93, -1, 91, -1, 88, -1, 84, -1],
      [84, -1, 89, -1, 93, -1, 89, -1, 96, -1, 93, -1, 89, -1, 84, -1],
      [81, -1, 86, -1, 89, -1, 86, -1, 93, -1, 89, -1, 86, -1, 81, -1],
      [86, -1, 91, -1, 95, -1, 91, -1, 98, -1, 95, -1, 91, -1, 86, -1],
    ],
    pulsePattern: [60, -1, -1, -1, 62, -1, -1, -1, 64, -1, -1, -1, 65, -1, -1, -1],
    padRoots: [53, 57],
    kickStartFreq: 110,
    kickEndFreq: 34,
    bassGain: 0.054,
    subGain: 0.038,
    chordGain: 0.031,
    pulseGain: 0.02,
    arpGain: 0.029,
    arpAccentGain: 0.02,
    bassFilter: 620,
    subFilter: 260,
    chordFilter: 1380,
    pulseFilter: 1080,
    arpFilter: 2320,
    arpAccentFilter: 3020,
    hatGain: 0.017,
    offHatGain: 0.011,
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

    if (step === 0 || step === 8) {
      this._playKick(time, step === 0 ? 0.075 : 0.045, track.kickStartFreq, track.kickEndFreq, 'bgm');
      this._playTone(
        midiToFreq(step < 8 ? track.padRoots[0] : track.padRoots[1]),
        time,
        stepLength * 7.6,
        {
          type: 'sine',
          gain: 0.044,
          attack: 0.06,
          release: 0.75,
          filter: track.subFilter + 90,
        },
        'bgm'
      );
    }

    if ((step === 6 || step === 14) && bar >= 1) {
      this._playNoise(time, 0.08, 0.012, 4200, 0.8, 'highpass', 'bgm');
    }

    if (step % 4 === 2) {
      this._playNoise(time + 0.008, 0.028, track.hatGain, 6200, 0.6, 'highpass', 'bgm');
    } else if (step % 8 === 5 && bar >= 2) {
      this._playNoise(time + 0.01, 0.025, track.offHatGain, 7000, 0.5, 'highpass', 'bgm');
    }

    if (step === 15 && bar === 3) {
      this._playNoise(time, 0.12, 0.016, 2600, 1.1, 'bandpass', 'bgm');
    }

    const bassNote = bassPattern[step];
    if (bassNote > 0) {
      this._playTone(
        midiToFreq(bassNote),
        time,
        stepLength * 1.45,
        {
          type: 'triangle',
          gain: track.bassGain,
          attack: 0.03,
          release: 0.34,
          filter: track.bassFilter,
        },
        'bgm'
      );
      this._playTone(
        midiToFreq(bassNote - 12),
        time,
        stepLength * 1.2,
        {
          type: 'sine',
          gain: track.subGain,
          attack: 0.03,
          release: 0.28,
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
          stepLength * 2.2,
          {
            type: 'triangle',
            gain: track.chordGain,
            attack: 0.04,
            release: 0.42,
            pan: step % 8 < 4 ? -0.24 + index * 0.08 : 0.24 - index * 0.08,
            filter: track.chordFilter,
          },
          'bgm'
        );
      });
    }

    const pulseNote = track.pulsePattern[step];
    if (pulseNote > 0 && step % 8 === 4) {
      this._playTone(
        midiToFreq(pulseNote),
        time + 0.012,
        stepLength * 1.7,
        {
          type: 'sine',
          gain: track.pulseGain,
          attack: 0.03,
          release: 0.24,
          pan: step % 8 === 4 ? -0.12 : 0.12,
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
        stepLength * 0.95,
        {
          type: step % 8 === 0 ? 'sine' : 'triangle',
          gain: bar >= 2 ? track.arpGain + 0.003 : track.arpGain,
          attack: 0.02,
          release: 0.18,
          pan: step % 2 === 0 ? -0.3 : 0.3,
          filter: bar >= 2 ? track.arpFilter + 120 : track.arpFilter,
        },
        'bgm'
      );
    }

    if (arpNote > 0 && bar >= 1 && step % 8 === 6) {
      this._playTone(
        midiToFreq(arpNote + 12),
        time + 0.045,
        stepLength * 0.5,
        {
          type: 'sine',
          gain: track.arpAccentGain,
          attack: 0.01,
          release: 0.16,
          pan: step % 2 === 0 ? 0.22 : -0.22,
          filter: track.arpAccentFilter,
        },
        'bgm'
      );
    }
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
