import { Camera } from './camera';
import { canvasHeight, canvasWidth, initialZoom, Skills, Themes, zoomThreshold } from './data/constants';
import { defaultLunchEventPool, getLunchEventNotice, getLunchEventTitles } from './data/lunchEvents';
import { type StageDef, stages } from './data/maps';
import { getStageBackdrop, type StageBackdropId } from './data/stageBackdrops';
import { FastForwader } from './fastForwader';
import type { GameObject } from './gameObject';
import { GoalCelebrationEffect } from './goalCelebrationEffect';
import type { IPhysics } from './IPhysics';
import { Marble } from './marble';
import { Minimap } from './minimap';
import options from './options';
import { ParticleManager } from './particleManager';
import { Box2dPhysics } from './physics-box2d';
import { RankRenderer } from './rankRenderer';
import { RouletteRenderer } from './rouletteRenderer';
import { SharkRushEffect } from './sharkRushEffect';
import { SkillEffect } from './skillEffect';
import type { ColorTheme } from './types/ColorTheme';
import type { MouseEventHandlerName, MouseEventName } from './types/mouseEvents.type';
import type { LunchEventId, LunchEventNotice } from './types/RoundEvent.type';
import type { UIObject } from './UIObject';
import { bound } from './utils/bound.decorator';
import { parseName, shuffle } from './utils/utils';
import { VideoRecorder } from './utils/videoRecorder';

function isCompactViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= 980;
}

function getDefaultGravity() {
  return { x: 0, y: isCompactViewport() ? 4.9 : 6.2 };
}

const roundEventWeights: Partial<Record<LunchEventId, number>> = {
  'shark-rush': 12,
  'bomb-burst': 3,
};

export type StageSummary = {
  index: number;
  title: string;
  description: string;
  flavor: string;
  accent: string;
  backdrop: StageBackdropId;
  eventTitles: string[];
};

export class Roulette extends EventTarget {
  private _marbles: Marble[] = [];

  private _lastTime = 0;
  private _elapsed = 0;

  private _updateInterval = 10;
  private _timeScale = 1;
  private _speed = 1;

  private _winners: Marble[] = [];
  private _particleManager = new ParticleManager();
  private _stage: StageDef | null = null;
  private _stageIndex = 0;

  protected _camera: Camera = new Camera();
  protected _renderer: RouletteRenderer;

  private _effects: GameObject[] = [];

  private _winnerRank = 0;
  private _totalMarbleCount = 0;
  private _goalDist = Infinity;
  private _isRunning = false;
  private _winner: Marble | null = null;

  private _uiObjects: UIObject[] = [];

  private _autoRecording = false;
  private _recorder!: VideoRecorder;

  private physics!: IPhysics;

  private _isReady = false;
  protected fastForwarder!: FastForwader;
  protected _theme: ColorTheme = Themes.dark;

  private _roundElapsed = 0;
  private _eventTimeline: number[] = [];
  private _nextEventIndex = 0;
  private _lastRoundEventId: LunchEventId | null = null;
  private _roundSpeedMultiplier = 1;
  private _speedEffectRemaining = 0;
  private _gravityEffectRemaining = 0;
  private _gravityOverride: { x: number; y: number } | null = null;
  private _finalApproachTriggered = false;
  private _closeRaceAssistCooldown = 0;

  get isReady() {
    return this._isReady;
  }

  protected createRenderer(): RouletteRenderer {
    return new RouletteRenderer();
  }

  protected createFastForwader(): FastForwader {
    return new FastForwader();
  }

  constructor() {
    super();
    this._renderer = this.createRenderer();
    this._renderer.init().then(() => {
      this._init().then(() => {
        this._isReady = true;
        this._update();
      });
    });
  }

  public getZoom() {
    return initialZoom * this._camera.zoom;
  }

  private addUiObject(obj: UIObject) {
    this._uiObjects.push(obj);
    if (obj.onWheel) {
      this._renderer.canvas.addEventListener('wheel', obj.onWheel);
    }
    if (obj.onMessage) {
      obj.onMessage((msg) => {
        this.dispatchEvent(new CustomEvent('message', { detail: msg }));
      });
    }
  }

  @bound
  private _update() {
    if (!this._lastTime) this._lastTime = Date.now();
    const currentTime = Date.now();

    this._elapsed +=
      (currentTime - this._lastTime) * this._speed * this.fastForwarder.speed * this._roundSpeedMultiplier;
    if (this._elapsed > 100) {
      this._elapsed %= 100;
    }
    this._lastTime = currentTime;

    const interval = (this._updateInterval / 1000) * this._timeScale;

    while (this._elapsed >= this._updateInterval) {
      this._updateRoundSystems(this._updateInterval);
      this.physics.step(interval);
      this._updateMarbles(this._updateInterval);
      this._particleManager.update(this._updateInterval);
      this._updateEffects(this._updateInterval);
      this._elapsed -= this._updateInterval;
      this._uiObjects.forEach((obj) => obj.update(this._updateInterval));
    }

    if (this._marbles.length > 1) {
      this._marbles.sort((a, b) => b.y - a.y);
    }

    if (this._stage) {
      this._camera.update({
        marbles: this._marbles,
        stage: this._stage,
        needToZoom: this._goalDist < zoomThreshold,
        targetIndex: 0,
      });
    }

    this._render();
    window.requestAnimationFrame(this._update);
  }

  private _updateRoundSystems(deltaTime: number) {
    this._updateTemporaryRoundEffects(deltaTime);
    if (!this._isRunning || this._marbles.length <= 1) {
      return;
    }

    this._roundElapsed += deltaTime;
    while (
      this._nextEventIndex < this._eventTimeline.length &&
      this._roundElapsed >= this._eventTimeline[this._nextEventIndex]
    ) {
      this._nextEventIndex += 1;
      if (this._marbles.length > 2) {
        this._triggerRoundEvent();
      }
    }

    this._applyCloseRaceAssist();
  }

  private _updateTemporaryRoundEffects(deltaTime: number) {
    if (this._closeRaceAssistCooldown > 0) {
      this._closeRaceAssistCooldown = Math.max(0, this._closeRaceAssistCooldown - deltaTime);
    }

    if (this._speedEffectRemaining > 0) {
      this._speedEffectRemaining -= deltaTime;
      if (this._speedEffectRemaining <= 0) {
        this._speedEffectRemaining = 0;
        this._roundSpeedMultiplier = 1;
      }
    }

    if (this._gravityEffectRemaining > 0) {
      this._gravityEffectRemaining -= deltaTime;
      if (this._gravityEffectRemaining <= 0) {
        this._gravityEffectRemaining = 0;
        this._gravityOverride = null;
        this.physics.setGravity(getDefaultGravity());
      }
    }
  }

  private _applyCloseRaceAssist() {
    if (!this._stage || this._closeRaceAssistCooldown > 0) {
      return;
    }

    const ranked = this._marbles
      .filter((marble) => marble.isActive)
      .slice()
      .sort((a, b) => b.y - a.y);
    if (ranked.length < 2) {
      return;
    }

    const leader = ranked[0];
    const runnerUp = ranked[1];
    const progress = leader.y / this._stage.goalY;
    if (progress < 0.42) {
      return;
    }

    const third = ranked[2];
    const topGap = leader.y - runnerUp.y;
    const podiumGap = third ? leader.y - third.y : topGap;
    const desiredTopGap = progress > 0.82 ? 0.95 : progress > 0.68 ? 1.5 : 2.35;
    const desiredPackGap = progress > 0.82 ? 2.5 : progress > 0.68 ? 3.8 : 5.5;

    if (topGap <= desiredTopGap && podiumGap <= desiredPackGap) {
      this._closeRaceAssistCooldown = progress > 0.82 ? 140 : 220;
      return;
    }

    const tension = Math.min(1, Math.max(topGap - desiredTopGap, podiumGap - desiredPackGap * 0.72) / 4.8);
    if (tension <= 0.04) {
      this._closeRaceAssistCooldown = 180;
      return;
    }

    const leaderBrake = (progress > 0.82 ? 0.16 : 0.11) + tension * (progress > 0.82 ? 0.34 : 0.22);
    this.physics.nudgeMarble(leader.id, {
      x: (Math.random() - 0.5) * 0.12,
      y: -leaderBrake,
    });
    leader.impact = Math.max(leader.impact, 90 + tension * 110);

    const chasers = ranked.slice(1, Math.min(ranked.length, progress > 0.82 ? 4 : 5));
    chasers.forEach((marble, index) => {
      const distance = leader.y - marble.y;
      const catchup =
        (progress > 0.82 ? 0.16 : 0.1) + Math.max(0, distance - (1.15 + index * 0.8)) * 0.05 + tension * 0.18;
      const laneAdjust = Math.max(-0.18, Math.min(0.18, (leader.x - marble.x) * 0.05));

      this.physics.nudgeMarble(marble.id, {
        x: laneAdjust + (Math.random() - 0.5) * 0.08,
        y: catchup,
      });
      marble.impact = Math.max(marble.impact, 100 + tension * 120);
    });

    this._closeRaceAssistCooldown = progress > 0.82 ? 110 : 170;
  }

  private _updateMarbles(deltaTime: number) {
    if (!this._stage) return;

    for (let i = 0; i < this._marbles.length; i++) {
      const marble = this._marbles[i];
      marble.update(deltaTime);
      if (marble.skill === Skills.Impact) {
        marble.impact = 720;
        this._effects.push(new SkillEffect(marble.x, marble.y));
        this.physics.impact(marble.id);
        this.dispatchEvent(
          new CustomEvent('skill-trigger', {
            detail: { name: marble.name, accent: this._stage?.accent ?? '#f59e0b' },
          })
        );
      }
      if (marble.y > this._stage.goalY) {
        this._winners.push(marble);
        if (this._isRunning && this._winners.length === this._winnerRank + 1) {
          this._finishRound(marble);
        } else if (
          this._isRunning &&
          this._winnerRank === this._winners.length &&
          this._winnerRank === this._totalMarbleCount - 1
        ) {
          const fallbackWinner = this._marbles[i + 1];
          if (fallbackWinner) {
            this._finishRound(fallbackWinner);
          }
        }
        setTimeout(() => {
          this.physics.removeMarble(marble.id);
        }, 500);
      }
    }

    const focusPack = this._marbles
      .filter((marble) => marble.y <= this._stage.goalY)
      .slice()
      .sort((a, b) => b.y - a.y);
    const leader = focusPack[0];

    this._goalDist = Math.abs(this._stage.zoomY - (leader?.y ?? 0));
    this._timeScale = this._calcTimeScale(focusPack);
    this._maybeTriggerFinalApproach(focusPack);

    this._marbles = focusPack;
  }

  private _finishRound(marble: Marble) {
    this._effects.push(new GoalCelebrationEffect(marble.x, marble.y, this._stage?.accent));
    this._winner = marble;
    this._isRunning = false;
    this._clearRoundEffects();

    const accent = this._stage?.accent ?? '#f59e0b';
    const palette = [accent, '#fef08a', '#ffffff', `hsl(${marble.hue} 100% 62%)`];
    const centerX = this._renderer.width / 2;
    const centerY = this._renderer.height * 0.34;
    this._particleManager.shot(centerX, centerY, { count: 160, palette, sizeRange: [6, 18], speedRange: [90, 260] });
    this._particleManager.shot(centerX - 170, this._renderer.height * 0.24, {
      count: 110,
      palette,
      sizeRange: [5, 15],
      speedRange: [80, 220],
    });
    this._particleManager.shot(centerX + 170, this._renderer.height * 0.22, {
      count: 110,
      palette,
      sizeRange: [5, 15],
      speedRange: [80, 220],
    });
    this._particleManager.shot(centerX, this._renderer.height * 0.16, {
      count: 90,
      palette,
      sizeRange: [4, 13],
      speedRange: [70, 180],
    });

    this.dispatchEvent(
      new CustomEvent('goal', {
        detail: {
          winner: marble.name,
          stageTitle: this._stage?.title ?? '',
          accent,
        },
      })
    );
    setTimeout(() => {
      this._recorder.stop();
    }, 1000);
  }

  private _maybeTriggerFinalApproach(focusPack: Marble[]) {
    if (!this._stage || !this._isRunning || this._finalApproachTriggered) {
      return;
    }

    const contender = focusPack[0];
    if (!contender || this._winners.length >= this._winnerRank + 1) {
      return;
    }

    const runnerUp = focusPack[1];
    const packIsTight = Boolean(runnerUp && contender.y - runnerUp.y < 6.5);
    const isNearGoal = contender.y > this._stage.goalY - 18 || this._goalDist < zoomThreshold * 1.15;
    if (!packIsTight || !isNearGoal) {
      return;
    }

    this._finalApproachTriggered = true;
    this.dispatchEvent(
      new CustomEvent('final-approach', {
        detail: {
          contender: contender.name,
          stageTitle: this._stage.title,
          accent: this._stage.accent ?? '#f59e0b',
        },
      })
    );
  }

  private _calcTimeScale(focusPack: Marble[]): number {
    if (!this._stage) return 1;

    const contender = focusPack[0];
    const runnerUp = focusPack[1];
    if (
      this._winners.length < this._winnerRank + 1 &&
      contender &&
      runnerUp &&
      this._goalDist < zoomThreshold * 1.4 &&
      contender.y > this._stage.zoomY - zoomThreshold * 1.6
    ) {
      return Math.max(0.12, this._goalDist / (zoomThreshold * 1.2));
    }

    return 1;
  }

  private _updateEffects(deltaTime: number) {
    this._effects.forEach((effect) => effect.update(deltaTime));
    this._effects = this._effects.filter((effect) => !effect.isDestroy);
  }

  private _render() {
    if (!this._stage) return;
    const renderParams = {
      camera: this._camera,
      stage: this._stage,
      entities: this.physics.getEntities(),
      marbles: this._marbles,
      winners: this._winners,
      particleManager: this._particleManager,
      effects: this._effects,
      winnerRank: this._winnerRank,
      winner: this._winner,
      size: { x: this._renderer.width, y: this._renderer.height },
      theme: this._theme,
    };
    this._renderer.render(renderParams, this._uiObjects);
  }

  private async _init() {
    this._recorder = new VideoRecorder(this._renderer.canvas);

    this.physics = new Box2dPhysics();
    await this.physics.init();

    this.addUiObject(new RankRenderer());
    this.attachEvent();
    const minimap = new Minimap();
    minimap.onViewportChange((pos) => {
      if (pos) {
        this._camera.setPosition(
          {
            x: pos.x,
            y: this._stage ? this._camera.toVisualY(pos.y) : pos.y,
          },
          false
        );
        this._camera.lock(true);
      } else {
        this._camera.lock(false);
      }
    });
    this.addUiObject(minimap);
    this.fastForwarder = this.createFastForwader();
    this.addUiObject(this.fastForwarder);
    this._stageIndex = 0;
    this._stage = stages[this._stageIndex];
    this._loadMap();
    this._notifyStageChange();
  }

  @bound
  private mouseHandler(eventName: MouseEventName, e: MouseEvent) {
    const handlerName = `on${eventName}` as MouseEventHandlerName;

    const sizeFactor = this._renderer.sizeFactor;
    const pos = { x: e.offsetX * sizeFactor, y: e.offsetY * sizeFactor };
    this._uiObjects.forEach((obj) => {
      if (!obj[handlerName]) return;
      const bounds = obj.getBoundingBox();
      if (!bounds) {
        obj[handlerName]({ ...pos, button: e.button });
      } else if (
        pos.x >= bounds.x &&
        pos.y >= bounds.y &&
        pos.x <= bounds.x + bounds.w &&
        pos.y <= bounds.y + bounds.h
      ) {
        obj[handlerName]({ x: pos.x - bounds.x, y: pos.y - bounds.y, button: e.button });
      } else {
        obj[handlerName](undefined);
      }
    });
  }

  private attachEvent() {
    const canvas = this._renderer.canvas;
    const onPointerRelease = (e: Event) => {
      this.mouseHandler('MouseUp', e as MouseEvent);
      window.removeEventListener('pointerup', onPointerRelease);
      window.removeEventListener('pointercancel', onPointerRelease);
    };

    canvas.addEventListener('pointerdown', (e: Event) => {
      this.mouseHandler('MouseDown', e as MouseEvent);
      window.addEventListener('pointerup', onPointerRelease);
      window.addEventListener('pointercancel', onPointerRelease);
    });

    ['MouseMove', 'DblClick'].forEach((ev) => {
      // @ts-expect-error
      canvas.addEventListener(ev.toLowerCase().replace('mouse', 'pointer'), this.mouseHandler.bind(this, ev));
    });
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private _loadMap() {
    if (!this._stage) {
      throw new Error('No map has been selected');
    }

    this.physics.createStage(this._stage);
    this.physics.setGravity(getDefaultGravity());
    this._camera.setFlow(this._stage.goalY, true);
    this._camera.initializePosition();
  }

  private _resetRoundFlow() {
    this._roundElapsed = 0;
    this._eventTimeline = [];
    this._nextEventIndex = 0;
    this._lastRoundEventId = null;
    this._finalApproachTriggered = false;
    this._closeRaceAssistCooldown = 0;
    this._clearRoundEffects();
  }

  private _clearRoundEffects() {
    this._roundSpeedMultiplier = 1;
    this._speedEffectRemaining = 0;
    this._gravityEffectRemaining = 0;
    this._gravityOverride = null;
    if (this.physics) {
      this.physics.setGravity(getDefaultGravity());
    }
  }

  private _scheduleRoundEvents() {
    const pace = isCompactViewport() ? 1.34 : 1;
    const totalEvents = Math.max(5, Math.min(9, Math.ceil(this._totalMarbleCount / (isCompactViewport() ? 2.4 : 2.2))));
    const schedule: number[] = [];
    let nextAt = (1750 + Math.random() * 850) * pace;
    for (let i = 0; i < totalEvents; i++) {
      schedule.push(nextAt);
      nextAt += (2250 + Math.random() * 1350) * pace;
    }
    this._eventTimeline = schedule;
    this._nextEventIndex = 0;
  }

  private _triggerRoundEvent() {
    if (!this._stage) return;

    const pool =
      this._stage.eventPool && this._stage.eventPool.length > 0 ? this._stage.eventPool : defaultLunchEventPool;
    const weights = pool.map((id) => {
      const baseWeight = roundEventWeights[id] ?? 1;
      if (id !== this._lastRoundEventId) {
        return baseWeight;
      }
      return id === 'shark-rush' ? baseWeight * 0.92 : baseWeight * 0.2;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight <= 0) return;

    let draw = Math.random() * totalWeight;
    let eventId: LunchEventId | undefined;
    for (let i = 0; i < pool.length; i++) {
      draw -= weights[i];
      if (draw <= 0) {
        eventId = pool[i];
        break;
      }
    }
    eventId ??= pool[pool.length - 1];
    if (!eventId) return;
    this._lastRoundEventId = eventId;
    this._executeRoundEvent(eventId);
  }

  private _executeRoundEvent(eventId: LunchEventId) {
    let notice: LunchEventNotice = getLunchEventNotice(eventId);
    const activeMarbles = this._marbles.filter((marble) => marble.isActive);
    if (activeMarbles.length === 0) {
      return;
    }

    switch (eventId) {
      case 'coffee-spill': {
        const direction = Math.random() < 0.5 ? -1 : 1;
        activeMarbles.forEach((marble) => {
          this.physics.nudgeMarble(marble.id, {
            x: direction * (1.2 + Math.random() * 0.8),
            y: 0.2 + Math.random() * 0.5,
          });
        });
        notice = {
          ...notice,
          description: `트레이가 미끄러지며 전체 구슬이 ${direction < 0 ? '왼쪽' : '오른쪽'}으로 밀려납니다.`,
        };
        break;
      }
      case 'espresso-shot': {
        this._roundSpeedMultiplier = 1.45;
        this._speedEffectRemaining = 3600;
        activeMarbles.forEach((marble) => {
          this.physics.nudgeMarble(marble.id, { x: 0, y: 0.5 + Math.random() * 0.4 });
        });
        break;
      }
      case 'meeting-call': {
        activeMarbles.forEach((marble) => {
          this.physics.shakeMarble(marble.id);
        });
        break;
      }
      case 'ac-draft': {
        const direction = Math.random() < 0.5 ? -1 : 1;
        this._gravityOverride = { x: direction * 2.2, y: getDefaultGravity().y };
        this.physics.setGravity(this._gravityOverride);
        this._gravityEffectRemaining = 4200;
        notice = {
          ...notice,
          description: `강한 에어컨 바람이 불어 구슬들이 ${direction < 0 ? '왼쪽' : '오른쪽'}으로 휘청였습니다.`,
        };
        notice = {
          ...notice,
          description: `차가운 에어컨 바람이 불어 모든 구슬이 ${direction < 0 ? '왼쪽' : '오른쪽'}으로 끌려갑니다.`,
        };
        break;
      }
      case 'bean-burst': {
        const center = activeMarbles[Math.floor(Math.random() * activeMarbles.length)];
        if (!center) return;
        center.impact = 500;
        this._effects.push(new SkillEffect(center.x, center.y));
        this.physics.impact(center.id);
        notice = {
          ...notice,
          description: `${center.name} 주변에서 원두 포대가 터지며 충격파가 번졌습니다.`,
        };
        notice = {
          ...notice,
          description: `${center.name}님이 원두 폭발에 휘말려 주변 구슬을 흔들어 놓았습니다.`,
        };
        break;
      }
      case 'bomb-burst': {
        const blastCount = 2 + Math.floor(Math.random() * 2);
        const blasts = activeMarbles
          .slice()
          .sort(() => Math.random() - 0.5)
          .slice(0, blastCount);

        blasts.forEach((center, blastIndex) => {
          this._effects.push(new GoalCelebrationEffect(center.x, center.y, notice.accent));
          this._effects.push(new SkillEffect(center.x, center.y));

          activeMarbles.forEach((marble) => {
            const dx = marble.x - center.x;
            const dy = marble.y - center.y;
            const distance = Math.max(0.45, Math.hypot(dx, dy));
            if (distance > 7.2) return;

            const distanceWeight = 1 - distance / 7.2;
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.18;
            const power = 0.9 + distanceWeight * 2.4 + blastIndex * 0.18;
            this.physics.nudgeMarble(marble.id, {
              x: Math.cos(angle) * power,
              y: Math.sin(angle) * power + 0.22,
            });
            marble.impact = Math.max(marble.impact, 260 + distanceWeight * 220);
          });
        });

        if (blasts.length > 0) {
          const blastNames = blasts.map((marble) => marble.name).join(', ');
          notice = {
            ...notice,
            description: `${blastNames} 주변에서 점심 폭탄이 연달아 터지며 순위가 크게 흔들렸습니다.`,
          };
        }
        break;
      }
      case 'sugar-crash': {
        this._roundSpeedMultiplier = 0.72;
        this._speedEffectRemaining = 3200;
        break;
      }
      case 'shark-rush': {
        const ranked = activeMarbles.slice().sort((a, b) => b.y - a.y);
        const lowerPool = ranked.slice(0, Math.max(1, Math.ceil(ranked.length * 0.45)));
        const upperPool = ranked.slice(Math.max(1, Math.floor(ranked.length * 0.45)));
        const lowerBias = this._roundElapsed > 8500 ? 0.78 : 0.52;
        const candidatePool =
          Math.random() < lowerBias && lowerPool.length > 0 ? lowerPool : upperPool.length > 0 ? upperPool : ranked;
        const candidate = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        if (!candidate) return;

        const direction = Math.random() < 0.5 ? 1 : -1;
        const sweepY = Math.max(
          24,
          Math.min((this._stage?.goalY ?? candidate.y + 10) - 5.5, candidate.y + (Math.random() - 0.5) * 6.5)
        );
        const band = 5.5;
        const startX = direction > 0 ? -2.8 : 28.4;
        const endX = direction > 0 ? 28.4 : -2.8;
        const impacted = ranked.filter((marble) => Math.abs(marble.y - sweepY) < band);
        const primary = impacted[0] ?? candidate;

        this._effects.push(new SharkRushEffect(startX, endX, sweepY, direction > 0 ? 1 : -1, notice.accent));

        impacted.forEach((marble, index) => {
          const distanceWeight = 1 - Math.min(1, Math.abs(marble.y - sweepY) / band);
          const spread = (Math.random() - 0.5) * 0.9;
          const sideImpulse = direction * (1.4 + distanceWeight * 1.7 + Math.random() * 0.45);
          const verticalImpulse = (Math.random() - 0.15) * 1.1 + (index === 0 ? 0.3 : 0);
          this.physics.nudgeMarble(marble.id, {
            x: sideImpulse + spread,
            y: verticalImpulse,
          });
          marble.impact = Math.max(marble.impact, 220 + distanceWeight * 180);
        });

        if (primary) {
          this._effects.push(new SkillEffect(primary.x, primary.y));
          notice = {
            ...notice,
            description: `${direction > 0 ? '왼쪽' : '오른쪽'}에서 상어가 난입해 ${primary.name}님 주변 순위를 뒤흔들었습니다.`,
          };
        }
        break;
      }
    }

    this.dispatchEvent(new CustomEvent('round-event', { detail: notice }));
  }

  private _getStageSummary(stage: StageDef, index: number): StageSummary {
    const eventPool = stage.eventPool && stage.eventPool.length > 0 ? stage.eventPool : defaultLunchEventPool;
    return {
      index,
      title: stage.title,
      description: stage.description ?? '기본 마블 룰렛 물리 맵입니다.',
      flavor: stage.flavor ?? '핀볼처럼 튀는 충돌이 살아 있는 오리지널 코스입니다.',
      accent: stage.accent ?? '#38bdf8',
      backdrop: stage.backdrop ?? getStageBackdrop(index),
      eventTitles: getLunchEventTitles(eventPool),
    };
  }

  private _notifyStageChange() {
    if (!this._stage) return;
    this.dispatchEvent(
      new CustomEvent('stagechange', { detail: this._getStageSummary(this._stage, this._stageIndex) })
    );
  }

  public clearMarbles() {
    this._isRunning = false;
    this.physics.clearMarbles();
    this._winner = null;
    this._winners = [];
    this._marbles = [];
    this._resetRoundFlow();
  }

  public start() {
    if (this._marbles.length === 0) {
      return;
    }

    this._isRunning = true;
    this._winnerRank = options.winningRank;
    if (this._winnerRank >= this._marbles.length) {
      this._winnerRank = this._marbles.length - 1;
    }

    this._winner = null;
    this._winners = [];
    this._goalDist = Infinity;
    this._camera.startFollowingMarbles();
    this._resetRoundFlow();
    this._scheduleRoundEvents();
    this.dispatchEvent(new CustomEvent('round-start', { detail: this.getCurrentMap() }));

    if (this._autoRecording) {
      this._recorder.start().then(() => {
        this.physics.start();
        this._marbles.forEach((marble) => {
          marble.isActive = true;
        });
      });
    } else {
      this.physics.start();
      this._marbles.forEach((marble) => {
        marble.isActive = true;
      });
    }
  }

  public setSpeed(value: number) {
    if (value <= 0) {
      throw new Error('Speed multiplier must larger than 0');
    }
    this._speed = value;
  }

  public setTheme(themeName: keyof typeof Themes) {
    this._theme = Themes[themeName];
  }

  public getSpeed() {
    return this._speed;
  }

  public setWinningRank(rank: number) {
    this._winnerRank = rank;
  }

  public setAutoRecording(value: boolean) {
    this._autoRecording = value;
  }

  public setMarbles(names: string[]) {
    this.reset();
    const arr = names.slice();

    let maxWeight = -Infinity;
    let minWeight = Infinity;

    const members = arr
      .map((nameString) => {
        const result = parseName(nameString);
        if (!result) return null;
        const { name, weight, count } = result;
        if (weight > maxWeight) maxWeight = weight;
        if (weight < minWeight) minWeight = weight;
        return { name, weight, count };
      })
      .filter((member) => !!member);

    const gap = maxWeight - minWeight;

    let totalCount = 0;
    members.forEach((member) => {
      if (member) {
        member.weight = 0.1 + (gap ? (member.weight - minWeight) / gap : 0);
        totalCount += member.count;
      }
    });

    const orders = shuffle(
      Array(totalCount)
        .fill(0)
        .map((_, i) => i)
    );
    members.forEach((member) => {
      if (member) {
        for (let j = 0; j < member.count; j++) {
          const order = orders.pop() || 0;
          this._marbles.push(new Marble(this.physics, order, totalCount, member.name, member.weight));
        }
      }
    });
    this._totalMarbleCount = totalCount;

    if (totalCount > 0) {
      const cols = Math.min(totalCount, 10);
      const rows = Math.ceil(totalCount / 10);
      const lineDelta = -Math.max(0, Math.ceil(rows - 5));
      const centerX = 10.25 + (cols - 1) * 0.3;
      const centerY = (1 + rows) / 2 + lineDelta;

      const spawnWidth = Math.max((cols - 1) * 0.6, 1);
      const spawnHeight = Math.max(rows - 1, 1);
      const margin = 4.8;
      const viewW = canvasWidth / initialZoom;
      const viewH = canvasHeight / initialZoom;
      const zoom = Math.max(
        1.15,
        Math.min(Math.min(viewW / (spawnWidth + margin * 2), viewH / (spawnHeight + margin * 2)), 2.25)
      );

      this._camera.initializePosition({ x: centerX, y: centerY }, zoom);
    }
  }

  private _clearMap() {
    this.physics.clear();
    this._marbles = [];
  }

  public reset() {
    this.clearMarbles();
    this._clearMap();
    this._loadMap();
    this._goalDist = Infinity;
  }

  public getCount() {
    return this._marbles.length;
  }

  public getMaps() {
    return stages.map((stage, index) => this._getStageSummary(stage, index));
  }

  public getCurrentMap() {
    const stage = this._stage ?? stages[this._stageIndex];
    return this._getStageSummary(stage, this._stageIndex);
  }

  public getSelectedMapIndex() {
    return this._stageIndex;
  }

  public setMap(index: number) {
    if (index < 0 || index > stages.length - 1) {
      throw new Error('Incorrect map number');
    }
    const names = this._marbles.map((marble) => marble.name);
    this._stageIndex = Number(index);
    this._stage = stages[this._stageIndex];
    this.setMarbles(names);
    this._camera.initializePosition();
    this._notifyStageChange();
  }
}
