import { Camera } from './camera';
import { canvasHeight, canvasWidth, initialZoom, Skills, Themes, zoomThreshold } from './data/constants';
import { defaultLunchEventPool, getLunchEventNotice, getLunchEventTitles } from './data/lunchEvents';
import { type StageDef, stages } from './data/maps';
import { getStageBackdrop, type StageBackdropId } from './data/stageBackdrops';
import { FastForwader } from './fastForwader';
import { FinishRankEffect } from './finishRankEffect';
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
import { SharkRushEffect, type SeaCreatureKind } from './sharkRushEffect';
import { SkillEffect } from './skillEffect';
import type { ColorTheme } from './types/ColorTheme';
import type { MouseEventHandlerName, MouseEventName } from './types/mouseEvents.type';
import type { LunchEventId, LunchEventNotice } from './types/RoundEvent.type';
import type { VectorLike } from './types/VectorLike';
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
  'shark-rush': 210,
  'bomb-burst': 1.2,
  'bean-burst': 0.95,
};

type SeaCreatureRushSpec = {
  kind: SeaCreatureKind;
  label: string;
  accent: string;
  band: number;
  lateralPower: number;
  verticalPower: number;
};

type GoalSpotlightState = {
  position: VectorLike;
  rank: number;
  name: string;
  accent: string;
  elapsed: number;
  duration: number;
};

const seaCreatureRushAngles = [-2.58, -2.18, -1.82, -1.36, -0.98, -0.54, -0.24, 0.24, 0.54, 0.98, 1.36, 1.82, 2.18, 2.58];
const sideScrollSeaCreatureRushAngles = [-2.76, -2.28, -1.86, -1.42, -1.02, -0.56, -0.18, 0.18, 0.56, 1.02, 1.42, 1.86, 2.28, 2.76];

const seaCreatureRushCatalog: Array<{
  kind: SeaCreatureKind;
  label: string;
  accent: string;
  band: number;
  lateralPower: number;
  verticalPower: number;
}> = [
  { kind: 'shark', label: '상어', accent: '#60a5fa', band: 5.8, lateralPower: 1.8, verticalPower: 1.12 },
  { kind: 'starfish', label: '불가사리', accent: '#fb923c', band: 4.7, lateralPower: 1.18, verticalPower: 0.92 },
  { kind: 'octopus', label: '문어', accent: '#c084fc', band: 5.3, lateralPower: 1.46, verticalPower: 1.22 },
  { kind: 'nakji', label: '낙지', accent: '#f472b6', band: 4.9, lateralPower: 1.38, verticalPower: 1.16 },
  { kind: 'jjukkumi', label: '쭈꾸미', accent: '#fb7185', band: 4.8, lateralPower: 1.34, verticalPower: 1.1 },
  { kind: 'mackerel', label: '고등어', accent: '#34d399', band: 5.4, lateralPower: 1.62, verticalPower: 0.98 },
  { kind: 'beltfish', label: '갈치', accent: '#e2e8f0', band: 6.1, lateralPower: 1.92, verticalPower: 1.04 },
];

function getFinishLine(stage: StageDef) {
  return stage.goalY - (stage.finishMargin ?? 0);
}

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
  private _celebrationTimeouts: number[] = [];
  private _winnerCelebrationElapsed = 0;
  private _seaCreatureRushEffects: Array<{ effect: SharkRushEffect; creature: SeaCreatureRushSpec }> = [];
  private _podiumSnapshot: Marble[] = [];
  private _goalSpotlightQueue: GoalSpotlightState[] = [];
  private _activeGoalSpotlight: GoalSpotlightState | null = null;

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
      this._updateGoalSpotlight(this._updateInterval);
      this._particleManager.update(this._updateInterval);
      this._updateEffects(this._updateInterval);
      if (this._winner) {
        this._winnerCelebrationElapsed += this._updateInterval;
      }
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
        goalSpotlight: this._activeGoalSpotlight?.position ?? null,
        goalSpotlightElapsed: this._activeGoalSpotlight?.elapsed ?? 0,
        goalSpotlightDuration: this._activeGoalSpotlight?.duration ?? 0,
        winnerSpotlight: this._isRunning ? null : this._winner,
        winnerSpotlightElapsed: this._winnerCelebrationElapsed,
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
    const progress = leader.y / getFinishLine(this._stage);
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
      if (marble.y > getFinishLine(this._stage)) {
        this._winners.push(marble);
        const finishRank = this._winners.length;
        if (finishRank <= 3) {
          const finishAccent =
            finishRank === 1 ? '#fde68a' : finishRank === 2 ? '#bfdbfe' : '#f9a8d4';
          this._effects.push(
            new FinishRankEffect(marble.x, getFinishLine(this._stage) + 1.15, finishRank, marble.name, finishAccent)
          );
        }
        if (this._isRunning) {
          this._queueGoalSpotlight(marble, finishRank);
        }
        if (this._isRunning && this._winners.length === this._winnerRank + 1) {
          this._finishRound(marble);
        }
        const removeDelay = finishRank <= 3 ? 980 : 500;
        setTimeout(() => {
          this.physics.removeMarble(marble.id);
        }, removeDelay);
      }
    }

    const focusPack = this._marbles
      .filter((marble) => marble.y <= getFinishLine(this._stage))
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
    this._winnerCelebrationElapsed = 0;
    this._isRunning = false;
    this._goalSpotlightQueue = [];
    this._activeGoalSpotlight = null;
    this._capturePodiumSnapshot();
    this._clearRoundEffects();

    const accent = this._stage?.accent ?? '#f59e0b';
    this._launchWinnerCelebration(marble, accent);

    this.dispatchEvent(
      new CustomEvent('goal', {
        detail: {
          winner: marble.name,
          stageTitle: this._stage?.title ?? '',
          accent,
          podium: this._podiumSnapshot.slice(0, 3).map((entry) => entry.name),
        },
      })
    );
    this._scheduleCelebration(4700, () => {
      this._recorder.stop();
    });
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
    const isNearGoal = contender.y > getFinishLine(this._stage) - 18 || this._goalDist < zoomThreshold * 1.15;
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

    if (this._activeGoalSpotlight) {
      return 0.34;
    }

    const contender = focusPack[0];
    const runnerUp = focusPack[1];
    const third = focusPack[2];
    if (
      this._winners.length < this._winnerRank + 1 &&
      contender &&
      runnerUp &&
      this._goalDist < zoomThreshold * 1.4 &&
      contender.y > this._stage.zoomY - zoomThreshold * 1.6
    ) {
      const podiumGap = contender.y - (third?.y ?? runnerUp.y);
      const tension = Math.max(0, Math.min(1, 1 - podiumGap / 11));
      return Math.max(0.08, this._goalDist / (zoomThreshold * 1.3) - tension * 0.12);
    }

    return 1;
  }

  private _queueGoalSpotlight(marble: Marble, rank: number) {
    if (!this._stage) {
      return;
    }

    const accent = rank === 1 ? '#fde68a' : rank === 2 ? '#bfdbfe' : rank === 3 ? '#f9a8d4' : this._stage.accent ?? '#f59e0b';
    this._goalSpotlightQueue.push({
      position: {
        x: marble.x,
        y: getFinishLine(this._stage) + 0.82,
      },
      rank,
      name: marble.name,
      accent,
      elapsed: 0,
      duration: rank <= 3 ? 860 : 620,
    });
  }

  private _updateGoalSpotlight(deltaTime: number) {
    if (!this._isRunning) {
      this._goalSpotlightQueue = [];
      this._activeGoalSpotlight = null;
      return;
    }

    if (!this._activeGoalSpotlight) {
      this._activeGoalSpotlight = this._goalSpotlightQueue.shift() ?? null;
    }

    if (!this._activeGoalSpotlight) {
      return;
    }

    this._activeGoalSpotlight.elapsed += deltaTime;
    if (this._activeGoalSpotlight.elapsed >= this._activeGoalSpotlight.duration) {
      this._activeGoalSpotlight = this._goalSpotlightQueue.shift() ?? null;
    }
  }

  private _capturePodiumSnapshot() {
    if (!this._stage) {
      this._podiumSnapshot = [];
      return;
    }

    const finishLine = getFinishLine(this._stage);
    const finished = this._winners.slice(0, 3);
    const finishedIds = new Set(finished.map((marble) => marble.id));
    const contenders = this._marbles
      .filter((marble) => !finishedIds.has(marble.id) && marble.y <= finishLine)
      .slice()
      .sort((a, b) => b.y - a.y);

    this._podiumSnapshot = [...finished, ...contenders].slice(0, 3);
  }

  private _updateEffects(deltaTime: number) {
    this._effects.forEach((effect) => effect.update(deltaTime));
    this._updateSeaCreatureRushContacts();
    this._effects = this._effects.filter((effect) => !effect.isDestroy);
    this._seaCreatureRushEffects = this._seaCreatureRushEffects.filter(({ effect }) => !effect.isDestroy);
  }

  private _updateSeaCreatureRushContacts() {
    if (this._seaCreatureRushEffects.length === 0) return;

    const activeMarbles = this._marbles.filter((marble) => marble.isActive);
    if (activeMarbles.length === 0) return;

    this._seaCreatureRushEffects.forEach(({ effect, creature }) => {
      if (effect.isDestroy) return;

      const position = effect.getPosition();
      const heading = effect.getHeading();
      const normal = { x: -heading.y, y: heading.x };

      activeMarbles.forEach((marble) => {
        if (effect.hasHitMarble(marble.id)) return;

        const contactStrength = effect.getContactStrength(marble.position, 0.25);
        if (contactStrength <= 0) return;

        effect.markHitMarble(marble.id);
        const offsetX = marble.x - position.x;
        const offsetY = marble.y - position.y;
        const offsetDistance = Math.hypot(offsetX, offsetY);
        const outward =
          offsetDistance > 0.08 ? { x: offsetX / offsetDistance, y: offsetY / offsetDistance } : { ...normal };
        const forwardPower = creature.lateralPower * (1.55 + contactStrength * 2.05 + Math.random() * 0.34);
        const crossDot = outward.x * normal.x + outward.y * normal.y;
        const sidePower = (crossDot * 0.86 + (Math.random() - 0.5) * 0.26) * creature.verticalPower * 1.35;
        const liftPower = Math.max(0.1, outward.y * 0.26 + 0.12);
        const push = {
          x: heading.x * forwardPower + normal.x * sidePower + outward.x * (0.42 + contactStrength * 0.36),
          y:
            heading.y * forwardPower +
            normal.y * sidePower +
            outward.y * (creature.verticalPower * 0.28 + liftPower + contactStrength * 0.18),
        };

        this.physics.nudgeMarble(marble.id, push);
        this.physics.nudgeMarble(marble.id, {
          x: push.x * 0.42,
          y: push.y * 0.42,
        });
        marble.impact = Math.max(marble.impact, 320 + contactStrength * 340);
      });
    });
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
      podium: this._podiumSnapshot,
      goalSpotlight: this._activeGoalSpotlight
        ? {
            rank: this._activeGoalSpotlight.rank,
            name: this._activeGoalSpotlight.name,
            accent: this._activeGoalSpotlight.accent,
            elapsed: this._activeGoalSpotlight.elapsed,
            duration: this._activeGoalSpotlight.duration,
          }
        : null,
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
      if (pos && this._stage) {
        this._camera.setWorldPosition(pos, this._stage, false);
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
    this._camera.setFlow(this._stage.goalY, true, this._stage.presentation);
    this._camera.initializePosition(this._stage);
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
    this._celebrationTimeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    this._celebrationTimeouts = [];
    this._seaCreatureRushEffects = [];
    this._roundSpeedMultiplier = 1;
    this._speedEffectRemaining = 0;
    this._gravityEffectRemaining = 0;
    this._gravityOverride = null;
    if (this.physics) {
      this.physics.setGravity(getDefaultGravity());
    }
  }

  private _scheduleCelebration(delay: number, callback: () => void) {
    const timeoutId = window.setTimeout(() => {
      this._celebrationTimeouts = this._celebrationTimeouts.filter((activeId) => activeId !== timeoutId);
      callback();
    }, delay);
    this._celebrationTimeouts.push(timeoutId);
  }

  private _pickSeaCreatureRush() {
    return seaCreatureRushCatalog[Math.floor(Math.random() * seaCreatureRushCatalog.length)] ?? seaCreatureRushCatalog[0];
  }

  private _getCameraViewportWorldBounds() {
    const stage = this._stage ?? stages[this._stageIndex];
    const zoom = this._camera.zoom * initialZoom;
    const cameraWorld = this._camera.getViewportCenter(stage);
    const viewW = this._renderer.width / zoom;
    const viewH = this._renderer.height / zoom;

    if (stage.presentation === 'side-scroll') {
      return {
        minX: cameraWorld.x - viewH / 2,
        maxX: cameraWorld.x + viewH / 2,
        minY: cameraWorld.y - viewW / 2,
        maxY: cameraWorld.y + viewW / 2,
      };
    }

    return {
      minX: cameraWorld.x - viewW / 2,
      maxX: cameraWorld.x + viewW / 2,
      minY: cameraWorld.y - viewH / 2,
      maxY: cameraWorld.y + viewH / 2,
    };
  }

  private _pickSeaCreatureRushAngle() {
    const angles =
      this._stage?.presentation === 'side-scroll' ? sideScrollSeaCreatureRushAngles : seaCreatureRushAngles;
    const baseAngle = angles[Math.floor(Math.random() * angles.length)] ?? 0;
    return baseAngle + (Math.random() - 0.5) * 0.16;
  }

  private _buildSeaCreatureRushPath(
    anchor: Marble,
    creature: SeaCreatureRushSpec,
    viewport: { minX: number; maxX: number; minY: number; maxY: number }
  ) {
    const spanX = viewport.maxX - viewport.minX;
    const spanY = viewport.maxY - viewport.minY;
    const angle = this._pickSeaCreatureRushAngle();
    const heading: VectorLike = { x: Math.cos(angle), y: Math.sin(angle) };
    const travel = Math.hypot(spanX, spanY) * 0.72 + creature.band + 3.8;
    return {
      start: {
        x: anchor.x - heading.x * travel,
        y: anchor.y - heading.y * travel,
      },
      end: {
        x: anchor.x + heading.x * travel,
        y: anchor.y + heading.y * travel,
      },
    };
  }

  private _launchWinnerCelebration(marble: Marble, accent: string) {
    const palette = [accent, '#fef08a', '#ffffff', '#fde68a', `hsl(${marble.hue} 100% 62%)`];
    const centerX = this._renderer.width / 2;
    const width = this._renderer.width;
    const height = this._renderer.height;
    const bursts = [
      { delay: 2860, x: centerX, y: height * 0.21, count: 286, sizeRange: [7, 20] as [number, number], speedRange: [138, 348] as [number, number] },
      { delay: 3010, x: centerX, y: height * 0.19, count: 196, sizeRange: [6, 18] as [number, number], speedRange: [112, 294] as [number, number] },
      { delay: 3180, x: centerX - width * 0.18, y: height * 0.27, count: 176, sizeRange: [5, 16] as [number, number], speedRange: [92, 246] as [number, number] },
      { delay: 3300, x: centerX + width * 0.2, y: height * 0.25, count: 176, sizeRange: [5, 16] as [number, number], speedRange: [92, 246] as [number, number] },
      { delay: 3460, x: centerX - width * 0.1, y: height * 0.14, count: 152, sizeRange: [4, 14] as [number, number], speedRange: [86, 232] as [number, number] },
      { delay: 3600, x: centerX + width * 0.12, y: height * 0.12, count: 152, sizeRange: [4, 14] as [number, number], speedRange: [86, 232] as [number, number] },
      { delay: 3740, x: centerX - width * 0.26, y: height * 0.2, count: 144, sizeRange: [4, 13] as [number, number], speedRange: [84, 220] as [number, number] },
      { delay: 3880, x: centerX + width * 0.28, y: height * 0.18, count: 144, sizeRange: [4, 13] as [number, number], speedRange: [84, 220] as [number, number] },
      { delay: 4040, x: centerX, y: height * 0.16, count: 214, sizeRange: [5, 17] as [number, number], speedRange: [100, 270] as [number, number] },
    ];

    this._scheduleCelebration(1860, () => {
      this._particleManager.shot(centerX, height * 0.34, {
        count: 42,
        palette: ['#ffffff', '#fff7d6', accent],
        sizeRange: [2, 7],
        speedRange: [42, 108],
        lifeRange: [760, 1180],
      });
    });

    this._scheduleCelebration(2140, () => {
      this._particleManager.shot(centerX, height * 0.36, {
        count: 68,
        palette: ['#ffffff', '#fff7d6', accent],
        sizeRange: [2, 8],
        speedRange: [54, 132],
        lifeRange: [860, 1320],
      });
    });

    this._scheduleCelebration(2540, () => {
      this._particleManager.shot(centerX, height * 0.27, {
        count: 136,
        palette,
        sizeRange: [4, 12],
        speedRange: [110, 260],
        lifeRange: [1100, 1800],
      });
      this._particleManager.shot(centerX, height * 0.27, {
        count: 94,
        palette: ['#ffffff', '#fff7d6', accent],
        sizeRange: [3, 9],
        speedRange: [72, 165],
        lifeRange: [980, 1480],
      });
    });

    bursts.forEach((burst) => {
      this._scheduleCelebration(burst.delay, () => {
        this._particleManager.shot(burst.x, burst.y, {
          count: burst.count,
          palette,
          sizeRange: burst.sizeRange,
          speedRange: burst.speedRange,
          lifeRange: [1500, 2800],
        });
        this._particleManager.shot(burst.x, burst.y, {
          count: Math.max(44, Math.round(burst.count * 0.38)),
          palette: ['#ffffff', '#fff7d6', accent],
          sizeRange: [3, 10],
          speedRange: [60, 150],
          lifeRange: [1100, 2000],
        });
      });
    });
  }

  private _scheduleRoundEvents() {
    const pace = isCompactViewport() ? 1.18 : 1;
    const totalEvents = Math.max(18, Math.min(30, Math.ceil(this._totalMarbleCount / (isCompactViewport() ? 0.9 : 0.82))));
    const schedule: number[] = [];
    let nextAt = (540 + Math.random() * 260) * pace;
    for (let i = 0; i < totalEvents; i++) {
      schedule.push(nextAt);
      nextAt += (520 + Math.random() * 380) * pace;
    }
    this._eventTimeline = schedule;
    this._nextEventIndex = 0;
  }

  private _triggerRoundEvent() {
    if (!this._stage) return;

    const pool =
      this._stage.eventPool && this._stage.eventPool.length > 0 ? this._stage.eventPool : defaultLunchEventPool;
    const prioritizeSeaRush = pool.includes('shark-rush') && Math.random() < 0.84;
    const weights = pool.map((id) => {
      const baseWeight = roundEventWeights[id] ?? 1;
      if (id !== this._lastRoundEventId) {
        return baseWeight;
      }
      return id === 'shark-rush' ? baseWeight * 0.92 : baseWeight * 0.18;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight <= 0) return;

    let eventId: LunchEventId | undefined;
    if (prioritizeSeaRush) {
      eventId = 'shark-rush';
    } else {
      let draw = Math.random() * totalWeight;
      for (let i = 0; i < pool.length; i++) {
        draw -= weights[i];
        if (draw <= 0) {
          eventId = pool[i];
          break;
        }
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
        const creature = this._pickSeaCreatureRush();
        const viewport = this._getCameraViewportWorldBounds();
        const visibleMarbles = activeMarbles.filter(
          (marble) =>
            marble.x >= viewport.minX - 1.4 &&
            marble.x <= viewport.maxX + 1.4 &&
            marble.y >= viewport.minY - 1.8 &&
            marble.y <= viewport.maxY + 1.8
        );
        const ranked = (visibleMarbles.length > 0 ? visibleMarbles : activeMarbles).slice().sort((a, b) => b.y - a.y);
        const lowerPool = ranked.slice(0, Math.max(1, Math.ceil(ranked.length * 0.45)));
        const upperPool = ranked.slice(Math.max(1, Math.floor(ranked.length * 0.45)));
        const lowerBias = this._roundElapsed > 8500 ? 0.82 : 0.6;
        const candidatePool =
          Math.random() < lowerBias && lowerPool.length > 0 ? lowerPool : upperPool.length > 0 ? upperPool : ranked;
        const candidate = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        if (!candidate) return;

        const rushPath = this._buildSeaCreatureRushPath(candidate, creature, viewport);
        const rushEffect = new SharkRushEffect(rushPath.start, rushPath.end, creature.accent, creature.kind);

        this._effects.push(rushEffect);
        this._seaCreatureRushEffects.push({ effect: rushEffect, creature });
        this._effects.push(new SkillEffect(candidate.x, candidate.y));
        notice = {
          ...notice,
          title: `${creature.label} ?ì’–ì—¯`,
          accent: creature.accent,
          description: `${creature.label}åª›Â€ ${candidate.name} äºŒì‡° ìœ„ì¹˜ë¥¼ ë¹„ìŠ¤ë“¬í•œ ê°ë„ë¡œ íŒŒê³ ë“œëŠ” ì¶©ëŒ ê¶¤ì ì„ ì‹œìž‘í–ˆìŠµë‹ˆë‹¤.`,
        };
        break;

        const direction = Math.random() < 0.5 ? 1 : -1;
        if (this._stage?.presentation === 'side-scroll') {
          const lanePadding = 1.1;
          const effectPadding = 4.2;
          const laneBand = Math.min(creature.band, Math.max(2.8, (viewport.maxX - viewport.minX) * 0.42));
          const sweepX = Math.max(
            viewport.minX + lanePadding,
            Math.min(viewport.maxX - lanePadding, candidate.x + (Math.random() - 0.5) * 3.4)
          );
          const startY = direction > 0 ? viewport.minY - effectPadding : viewport.maxY + effectPadding;
          const endY = direction > 0 ? viewport.maxY + effectPadding : viewport.minY - effectPadding;
          const impacted = ranked.filter((marble) => Math.abs(marble.x - sweepX) < laneBand);
          const primary = impacted[0] ?? candidate;

          this._effects.push(
            new SharkRushEffect(
              startY,
              endY,
              sweepX,
              direction > 0 ? 1 : -1,
              creature.accent,
              creature.kind,
              'vertical',
              Math.PI / 2
            )
          );

          impacted.forEach((marble, index) => {
            const distanceWeight = 1 - Math.min(1, Math.abs(marble.x - sweepX) / laneBand);
            const laneSpread = (Math.random() - 0.5) * 0.78;
            const progressImpulse =
              direction * (creature.lateralPower + distanceWeight * 1.82 + Math.random() * 0.48);
            const laneImpulse =
              (Math.random() - 0.12) * creature.verticalPower + (index === 0 ? 0.28 : 0.06);
            this.physics.nudgeMarble(marble.id, {
              x: laneImpulse + laneSpread,
              y: progressImpulse,
            });
            marble.impact = Math.max(marble.impact, 240 + distanceWeight * 210);
          });

          this._effects.push(new SkillEffect(primary.x, primary.y));
          notice = {
            ...notice,
            title: `${creature.label} 난입`,
            accent: creature.accent,
            description: `${direction > 0 ? '왼쪽' : '오른쪽'}에서 ${creature.label}가 튀어나와 ${primary.name}님 주변 대열을 거칠게 흔들었습니다.`,
          };
          break;
        }

        const sweepY = Math.max(
          viewport.minY + 1.6,
          Math.min(viewport.maxY - 1.6, candidate.y + (Math.random() - 0.5) * Math.min(5.8, viewport.maxY - viewport.minY))
        );
        const band = Math.min(creature.band, Math.max(3.4, (viewport.maxY - viewport.minY) * 0.34));
        const effectPadding = 4.2;
        const startX = direction > 0 ? viewport.minX - effectPadding : viewport.maxX + effectPadding;
        const endX = direction > 0 ? viewport.maxX + effectPadding : viewport.minX - effectPadding;
        const impacted = ranked.filter((marble) => Math.abs(marble.y - sweepY) < band);
        const primary = impacted[0] ?? candidate;

        this._effects.push(new SharkRushEffect(startX, endX, sweepY, direction > 0 ? 1 : -1, creature.accent, creature.kind));

        impacted.forEach((marble, index) => {
          const distanceWeight = 1 - Math.min(1, Math.abs(marble.y - sweepY) / band);
          const spread = (Math.random() - 0.5) * 0.9;
          const sideImpulse = direction * (creature.lateralPower + distanceWeight * 1.95 + Math.random() * 0.48);
          const verticalImpulse = (Math.random() - 0.12) * creature.verticalPower + (index === 0 ? 0.34 : 0.08);
          this.physics.nudgeMarble(marble.id, {
            x: sideImpulse + spread,
            y: verticalImpulse,
          });
          marble.impact = Math.max(marble.impact, 240 + distanceWeight * 210);
        });

        if (primary) {
          this._effects.push(new SkillEffect(primary.x, primary.y));
          notice = {
            ...notice,
            title: `${creature.label} 난입`,
            accent: creature.accent,
            description: `${direction > 0 ? '왼쪽' : '오른쪽'}에서 ${creature.label}가 튀어나와 ${primary.name}님 주변 대열을 거칠게 흔들었습니다.`,
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
    this._winnerCelebrationElapsed = 0;
    this._winners = [];
    this._podiumSnapshot = [];
    this._goalSpotlightQueue = [];
    this._activeGoalSpotlight = null;
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
    this._winnerCelebrationElapsed = 0;
    this._winners = [];
    this._podiumSnapshot = [];
    this._goalSpotlightQueue = [];
    this._activeGoalSpotlight = null;
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
    this._marbles.sort((a, b) => a.id - b.id);
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

      this._camera.initializePosition(this._stage ?? stages[this._stageIndex], { x: centerX, y: centerY }, zoom);
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
    if (this._stage) {
      this._camera.initializePosition(this._stage);
    }
    this._notifyStageChange();
  }
}
