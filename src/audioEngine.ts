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

const bpm = 118;
const stepLength = 60 / bpm / 2;
const scheduleAheadTime = 0.18;
const schedulerInterval = 80;

function midiToFreq(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export class AudioEngine {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _bgmGain: GainNode | null = null;
  private _sfxGain: GainNode | null = null;
  private _noiseBuffer: AudioBuffer | null = null;
  private _schedulerId: number | null = null;
  private _nextStepTime = 0;
  private _step = 0;
  private _isEnabled = true;
  private _hasStartedBgm = false;

  public setEnabled(value: boolean) {
    this._isEnabled = value;
    if (!this._ctx || !this._masterGain) return;

    if (value) {
      this._ctx.resume();
      this._masterGain.gain.setTargetAtTime(0.9, this._ctx.currentTime, 0.04);
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
      this._masterGain.gain.setTargetAtTime(this._isEnabled ? 0.9 : 0.0001, ctx.currentTime, 0.04);
    }
  }

  public startBgm() {
    const ctx = this._ensureContext();
    if (!ctx || !this._isEnabled || ctx.state === 'suspended') return;
    if (this._schedulerId !== null) return;

    this._hasStartedBgm = true;
    this._nextStepTime = ctx.currentTime + 0.06;
    this._schedulerId = window.setInterval(() => this._scheduler(), schedulerInterval);
  }

  public stopBgm() {
    if (this._schedulerId !== null) {
      window.clearInterval(this._schedulerId);
      this._schedulerId = null;
    }
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
    }
  }

  public playGoal() {
    if (!this._isEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx || !this._bgmGain) return;

    const start = ctx.currentTime + 0.02;
    this._bgmGain.gain.cancelScheduledValues(start);
    this._bgmGain.gain.setTargetAtTime(0.035, start, 0.03);
    this._bgmGain.gain.setTargetAtTime(0.09, start + 2.2, 0.18);

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

    master.gain.value = 0.0001;
    bgm.gain.value = 0.09;
    sfx.gain.value = 0.18;

    bgm.connect(master);
    sfx.connect(master);
    master.connect(ctx.destination);

    this._ctx = ctx;
    this._masterGain = master;
    this._bgmGain = bgm;
    this._sfxGain = sfx;
    this._noiseBuffer = this._createNoiseBuffer(ctx);
    return ctx;
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
      this._scheduleStep(this._step, this._nextStepTime);
      this._nextStepTime += stepLength;
      this._step = (this._step + 1) % 16;
    }
  }

  private _scheduleStep(step: number, time: number) {
    const bassPattern = [43, -1, 43, -1, 43, -1, 46, -1, 48, -1, 46, -1, 50, -1, 46, -1];
    const stabPattern = [67, -1, 70, -1, 74, -1, 77, -1, 69, -1, 72, -1, 76, -1, 79, -1];
    const shimmerPattern = [79, 82, 84, 86, 77, 81, 84, 88, 76, 79, 83, 86, 77, 81, 84, 89];

    if (step % 4 === 0) {
      this._playKick(time, 0.1, 110, 38, 'bgm');
      this._playTone(midiToFreq(step < 8 ? 55 : 57), time, stepLength * 3.8, {
        type: 'sine',
        gain: 0.025,
        attack: 0.02,
        release: 0.45,
        filter: 450,
      });
    }

    if (step === 4 || step === 12) {
      this._playNoise(time, 0.08, 0.03, 1800, 1.6, 'bandpass', 'bgm');
    }

    if (step % 2 === 0) {
      this._playNoise(time + 0.01, 0.05, 0.012, 6800, 1.5, 'highpass', 'bgm');
    }

    const bassNote = bassPattern[step];
    if (bassNote > 0) {
      this._playTone(midiToFreq(bassNote), time, stepLength * 1.75, {
        type: 'triangle',
        gain: 0.085,
        attack: 0.01,
        release: 0.28,
        filter: 700,
      });
    }

    const stabNote = stabPattern[step];
    if (stabNote > 0) {
      this._playTone(midiToFreq(stabNote), time + 0.01, stepLength * 0.7, {
        type: 'square',
        gain: 0.035,
        attack: 0.01,
        release: 0.1,
        pan: step % 8 < 4 ? -0.22 : 0.22,
        filter: 1400,
      });
    }

    const shimmerNote = shimmerPattern[step];
    this._playTone(midiToFreq(shimmerNote), time + 0.03, stepLength * 0.42, {
      type: 'triangle',
      gain: 0.025,
      attack: 0.005,
      release: 0.08,
      pan: step % 2 === 0 ? -0.28 : 0.28,
      filter: 2100,
    });
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
