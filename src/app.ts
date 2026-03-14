import { AudioEngine } from './audioEngine';
import options from './options';
import type { Roulette } from './roulette';
import type { LunchEventNotice } from './types/RoundEvent.type';

type WinnerMode = 'first' | 'last' | 'custom';

const storageKey = 'lunch_roulette_names_v3';
const audioStorageKey = 'lunch_roulette_audio';
const fixedRoster = ['Dominic', 'Martin'];
const sampleRoster = ['Alex', 'Mina', 'Chris', 'Jae', 'Sora', 'Yuna', 'Noah', 'Hana'];
const winnerLines = [
  '오늘 커피는 당신이 책임진다.',
  '점심의 신탁이 내려왔다. 이제 계산할 시간이다.',
  '구슬은 솔직했다. 커피는 네가 산다.',
  '오늘의 스폰서는 이미 정해져 있었다.',
];

function normalizeNameKey(value: string) {
  return value.trim().toLowerCase();
}

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

function waitForRoulette(roulette: Roulette): Promise<void> {
  return new Promise((resolve) => {
    const poll = () => {
      if (roulette.isReady) {
        resolve();
        return;
      }
      window.setTimeout(poll, 100);
    };
    poll();
  });
}

function parseNameToken(rawValue: string) {
  const value = rawValue.trim();
  const weight = Number(value.match(/\/(\d+)/)?.[1] ?? 1);
  const count = Number(value.match(/\*(\d+)/)?.[1] ?? 1);
  const name = (value.match(/^\s*([^/*]+)/)?.[1] ?? '').trim();
  return { name, weight, count };
}

function randomOf<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function attachApp(roulette: Roulette) {
  const audio = new AudioEngine();
  const setup = async () => {
    await waitForRoulette(roulette);

    const rosterInput = query<HTMLTextAreaElement>('#rosterInput');
    const mapSelect = query<HTMLSelectElement>('#mapSelect');
    const startButton = query<HTMLButtonElement>('#btnStart');
    const shuffleButton = query<HTMLButtonElement>('#btnShuffle');
    const demoButton = query<HTMLButtonElement>('#btnDemo');
    const firstWinnerButton = query<HTMLButtonElement>('#btnFirst');
    const lastWinnerButton = query<HTMLButtonElement>('#btnLast');
    const winningRankInput = query<HTMLInputElement>('#winningRank');
    const recordToggle = query<HTMLInputElement>('#recordToggle');
    const audioToggle = query<HTMLInputElement>('#audioToggle');
    const skillToggle = query<HTMLInputElement>('#skillToggle');
    const themeToggle = query<HTMLInputElement>('#themeToggle');
    const stageTitle = query<HTMLElement>('#stageTitle');
    const stageDescription = query<HTMLElement>('#stageDescription');
    const stageFlavor = query<HTMLElement>('#stageFlavor');
    const eventBadges = query<HTMLElement>('#eventBadges');
    const eventFeed = query<HTMLElement>('#eventFeed');
    const resultPanel = query<HTMLElement>('#resultPanel');
    const winnerName = query<HTMLElement>('#winnerName');
    const winnerLine = query<HTMLElement>('#winnerLine');
    const winnerMap = query<HTMLElement>('#winnerMap');
    const winnerShowcase = query<HTMLElement>('#winnerShowcase');
    const winnerShowcaseLabel = query<HTMLElement>('#winnerShowcaseLabel');
    const winnerShowcaseName = query<HTMLElement>('#winnerShowcaseName');
    const winnerShowcaseStage = query<HTMLElement>('#winnerShowcaseStage');
    const statusPill = query<HTMLElement>('#statusPill');
    const liveStatus = query<HTMLElement>('#liveStatus');
    const mobileHudToggle = query<HTMLButtonElement>('#mobileHudToggle');
    const toastRoot = query<HTMLElement>('#toastRoot');
    const goalOverlay = query<HTMLElement>('#goalOverlay');
    const mobileLayout = window.matchMedia('(max-width: 980px)');

    let ready = false;
    let winnerMode: WinnerMode = 'first';
    let resetTimer = 0;
    let goalOverlayTimer = 0;
    let winnerShowcaseTimer = 0;
    let bgmStopTimer = 0;
    let roundRunning = false;

    const getRosterTokens = () => {
      const merged = new Map<string, number>();
      const fixedRosterSet = new Set(fixedRoster.map(normalizeNameKey));
      fixedRoster.forEach((name) => {
        merged.set(name, 1);
      });

      rosterInput.value
        .split(/[,\r\n]/g)
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((token) => {
          const parsed = parseNameToken(token);
          if (!parsed.name || fixedRosterSet.has(normalizeNameKey(parsed.name))) {
            return;
          }

          const key = parsed.weight > 1 ? `${parsed.name}/${parsed.weight}` : parsed.name;
          merged.set(key, (merged.get(key) ?? 0) + parsed.count);
        });

      return [...merged.entries()].map(([key, count]) => (count > 1 ? `${key}*${count}` : key));
    };

    const setStatus = (pill: string, text: string) => {
      statusPill.textContent = pill;
      liveStatus.textContent = text;
    };

    const setMobileHudOpen = (open: boolean) => {
      document.body.classList.toggle('mobile-hud-open', open);
      mobileHudToggle.textContent = open ? '게임 보기' : '설정 보기';
      mobileHudToggle.setAttribute('aria-expanded', String(open));
    };

    const syncMobileHudState = () => {
      const showToggle = roundRunning;
      mobileHudToggle.hidden = !showToggle;

      if (!showToggle) {
        document.body.classList.remove('mobile-hud-open');
        mobileHudToggle.textContent = '설정 보기';
        mobileHudToggle.setAttribute('aria-expanded', 'false');
      } else if (!document.body.classList.contains('mobile-hud-open')) {
        setMobileHudOpen(false);
      }
    };

    const setRoundFocus = (running: boolean) => {
      roundRunning = running;
      document.body.classList.toggle('round-focus', running);

      if (!running) {
        document.body.classList.remove('mobile-hud-open');
      } else {
        setMobileHudOpen(false);
      }

      syncMobileHudState();
    };

    const showToast = (message: string, accent = '#f59e0b') => {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      toast.style.setProperty('--accent', accent);
      toastRoot.append(toast);
      window.setTimeout(() => {
        toast.classList.add('leave');
      }, 1100);
      window.setTimeout(() => {
        toast.remove();
      }, 1500);
    };

    const hideWinnerShowcase = () => {
      if (winnerShowcaseTimer) {
        window.clearTimeout(winnerShowcaseTimer);
        winnerShowcaseTimer = 0;
      }
      winnerShowcase.hidden = true;
      document.body.classList.remove('winner-showcase');
    };

    const showWinnerShowcase = (winner: string, stageTitle: string, accent: string) => {
      document.documentElement.style.setProperty('--goal-accent', accent);
      winnerShowcaseLabel.textContent = '오늘의 커피 당첨';
      winnerShowcaseName.textContent = winner;
      winnerShowcaseStage.textContent = `${stageTitle} 최종 통과`;
      winnerShowcase.hidden = false;
      document.body.classList.add('winner-showcase');

      if (winnerShowcaseTimer) {
        window.clearTimeout(winnerShowcaseTimer);
      }

      winnerShowcaseTimer = window.setTimeout(() => {
        winnerShowcase.hidden = true;
        document.body.classList.remove('winner-showcase');
      }, 3000);
    };

    const triggerGoalOverlay = (accent: string) => {
      document.documentElement.style.setProperty('--goal-accent', accent);
      goalOverlay.classList.remove('active');
      void goalOverlay.offsetWidth;
      goalOverlay.classList.add('active');
      document.body.classList.add('goal-celebration');

      if (goalOverlayTimer) {
        window.clearTimeout(goalOverlayTimer);
      }

      goalOverlayTimer = window.setTimeout(() => {
        goalOverlay.classList.remove('active');
        document.body.classList.remove('goal-celebration');
      }, 2200);
    };

    const appendFeedItem = (title: string, description: string, accent: string, tone = 'event') => {
      const item = document.createElement('article');
      item.className = `feed-item ${tone}`;
      item.style.setProperty('--accent', accent);

      const heading = document.createElement('h4');
      heading.textContent = title;
      const body = document.createElement('p');
      body.textContent = description;

      item.append(heading, body);
      eventFeed.prepend(item);
      while (eventFeed.children.length > 6) {
        eventFeed.lastElementChild?.remove();
      }
    };

    const clearFeed = () => {
      eventFeed.innerHTML = '';
    };

    const normalizeRoster = () => {
      rosterInput.value = getRosterTokens().join('\n');
    };

    const syncTheme = () => {
      options.darkMode = themeToggle.checked;
      roulette.setTheme(options.darkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('light', !options.darkMode);
    };

    const setWinnerRank = (rank: number) => {
      const safeRank = Math.max(1, rank || 1);
      winningRankInput.value = String(safeRank);
      options.winningRank = safeRank - 1;
      roulette.setWinningRank(options.winningRank);

      firstWinnerButton.classList.toggle('active', winnerMode === 'first');
      lastWinnerButton.classList.toggle('active', winnerMode === 'last');
      winningRankInput.classList.toggle('active', winnerMode === 'custom');
    };

    const refreshBoard = () => {
      const names = getRosterTokens();
      roulette.setMarbles(names);
      ready = names.length > 0;
      localStorage.setItem(storageKey, names.join('\n'));

      if (winnerMode === 'last') {
        setWinnerRank(Math.max(1, roulette.getCount()));
      } else if (winnerMode === 'first') {
        setWinnerRank(1);
      } else {
        setWinnerRank(Number.parseInt(winningRankInput.value, 10) || 1);
      }

      startButton.disabled = !ready;
      setStatus(
        ready ? '준비 완료' : '명단 대기',
        ready
          ? `${roulette.getCount()}명의 구슬이 오늘의 커피 내기를 기다리고 있습니다.`
          : '최소 한 명의 이름을 입력해 주세요.'
      );
    };

    const renderStage = (stage: ReturnType<Roulette['getCurrentMap']>) => {
      stageTitle.textContent = stage.title;
      stageDescription.textContent = stage.description;
      stageFlavor.textContent = stage.flavor;
      document.documentElement.style.setProperty('--stage-accent', stage.accent);

      eventBadges.innerHTML = '';
      stage.eventTitles.forEach((title) => {
        const badge = document.createElement('span');
        badge.className = 'event-badge';
        badge.textContent = title;
        eventBadges.append(badge);
      });
      winnerMap.textContent = `맵: ${stage.title}`;
    };

    const startRound = () => {
      normalizeRoster();
      refreshBoard();

      if (!ready) {
        showToast('라운드를 시작하려면 명단이 필요합니다.', '#ef4444');
        return;
      }

      if (resetTimer) {
        window.clearTimeout(resetTimer);
        resetTimer = 0;
      }

      if (bgmStopTimer) {
        window.clearTimeout(bgmStopTimer);
        bgmStopTimer = 0;
      }

      hideWinnerShowcase();

      resultPanel.hidden = true;
      clearFeed();
      startButton.disabled = true;
      audio.unlock();
      audio.startBgm();
      audio.playRoundStart();
      roulette.start();
    };

    recordToggle.checked = options.autoRecording;
    skillToggle.checked = options.useSkills;
    themeToggle.checked = options.darkMode;
    options.audioEnabled = localStorage.getItem(audioStorageKey) !== 'false';
    audioToggle.checked = options.audioEnabled;
    audio.setEnabled(options.audioEnabled);
    syncTheme();

    const savedRoster = localStorage.getItem(storageKey)?.trim();
    rosterInput.value = savedRoster || fixedRoster.join('\n');

    const maps = roulette.getMaps();
    maps.forEach((map) => {
      const option = document.createElement('option');
      option.value = String(map.index);
      option.textContent = map.title;
      mapSelect.append(option);
    });
    mapSelect.value = String(roulette.getSelectedMapIndex());
    renderStage(roulette.getCurrentMap());

    rosterInput.addEventListener('input', refreshBoard);
    rosterInput.addEventListener('blur', () => {
      normalizeRoster();
      refreshBoard();
    });

    shuffleButton.addEventListener('click', refreshBoard);
    demoButton.addEventListener('click', () => {
      audio.playUiClick();
      rosterInput.value = [...fixedRoster, ...sampleRoster].join('\n');
      refreshBoard();
      showToast('샘플 명단을 불러왔습니다.', '#38bdf8');
    });
    startButton.addEventListener('click', startRound);
    mobileHudToggle.addEventListener('click', () => {
      audio.playUiClick();
      setMobileHudOpen(!document.body.classList.contains('mobile-hud-open'));
    });

    mapSelect.addEventListener('change', () => {
      audio.playUiClick();
      roulette.setMap(Number(mapSelect.value));
      renderStage(roulette.getCurrentMap());
      refreshBoard();
    });

    firstWinnerButton.addEventListener('click', () => {
      audio.playUiClick();
      winnerMode = 'first';
      setWinnerRank(1);
    });

    lastWinnerButton.addEventListener('click', () => {
      audio.playUiClick();
      winnerMode = 'last';
      setWinnerRank(Math.max(1, roulette.getCount()));
    });

    winningRankInput.addEventListener('change', () => {
      winnerMode = 'custom';
      setWinnerRank(Number.parseInt(winningRankInput.value, 10) || 1);
    });

    recordToggle.addEventListener('change', () => {
      options.autoRecording = recordToggle.checked;
      roulette.setAutoRecording(options.autoRecording);
    });

    skillToggle.addEventListener('change', () => {
      options.useSkills = skillToggle.checked;
    });

    audioToggle.addEventListener('change', async () => {
      options.audioEnabled = audioToggle.checked;
      localStorage.setItem(audioStorageKey, String(options.audioEnabled));
      await audio.unlock();
      audio.setEnabled(options.audioEnabled);
      if (options.audioEnabled) {
        audio.playUiClick();
      }
    });

    themeToggle.addEventListener('change', syncTheme);

    const onViewportChange = () => {
      if (roundRunning) {
        setMobileHudOpen(false);
      }
      syncMobileHudState();
    };

    if ('addEventListener' in mobileLayout) {
      mobileLayout.addEventListener('change', onViewportChange);
    } else {
      mobileLayout.addListener(onViewportChange);
    }

    roulette.addEventListener('stagechange', (event) => {
      const detail = (event as CustomEvent<ReturnType<Roulette['getCurrentMap']>>).detail;
      renderStage(detail);
      appendFeedItem('맵 준비 완료', detail.flavor, detail.accent, 'system');
    });

    roulette.addEventListener('round-start', (event) => {
      const detail = (event as CustomEvent<ReturnType<Roulette['getCurrentMap']>>).detail;
      setRoundFocus(true);
      clearFeed();
      appendFeedItem('라운드 시작', `${detail.title}에서 구슬이 쏟아졌습니다.`, detail.accent, 'system');
      setStatus('진행 중', '혼돈의 점심 내기가 시작됐습니다.');
    });

    roulette.addEventListener('round-event', (event) => {
      const detail = (event as CustomEvent<LunchEventNotice>).detail;
      appendFeedItem(detail.title, detail.description, detail.accent);
      showToast(detail.title, detail.accent);
      audio.playRoundEvent(detail.id);
    });

    roulette.addEventListener('final-approach', (event) => {
      const detail = (event as CustomEvent<{ contender: string; stageTitle: string; accent: string }>).detail;
      appendFeedItem(
        '결승 직전',
        `${detail.contender}님이 ${detail.stageTitle}의 마지막 관문에 진입했습니다.`,
        detail.accent,
        'system'
      );
      setStatus('결승 직전', `${detail.contender}님이 거의 골인 직전입니다.`);
      showToast(`${detail.contender}님 결승 직전!`, detail.accent);
      audio.playFinalApproach();
    });

    roulette.addEventListener('goal', (event) => {
      const detail = (event as CustomEvent<{ winner: string; stageTitle: string; accent: string }>).detail;
      setRoundFocus(false);
      ready = false;
      startButton.disabled = true;
      winnerName.textContent = detail.winner;
      winnerLine.textContent = randomOf(winnerLines);
      resultPanel.hidden = false;
      showWinnerShowcase(detail.winner, detail.stageTitle, detail.accent);
      setStatus('오늘의 당첨', `${detail.winner}님이 뽑혔습니다. 잠시 후 다음 라운드를 준비합니다.`);
      appendFeedItem(
        '골인',
        `${detail.winner}님이 ${detail.stageTitle}을 통과해 오늘의 커피 당첨자가 됐습니다.`,
        detail.accent
      );
      triggerGoalOverlay(detail.accent);
      audio.playGoal();
      if (bgmStopTimer) {
        window.clearTimeout(bgmStopTimer);
      }
      bgmStopTimer = window.setTimeout(() => {
        audio.stopBgm();
        bgmStopTimer = 0;
      }, 1800);

      resetTimer = window.setTimeout(() => {
        refreshBoard();
      }, 3300);
    });

    roulette.addEventListener('message', (event) => {
      showToast((event as CustomEvent<string>).detail, '#fcd34d');
    });

    refreshBoard();
    syncMobileHudState();
    appendFeedItem(
      '점심 내기 모드 준비 완료',
      '세 가지 사무실 맵과 라운드 이벤트가 활성화되었습니다.',
      '#f59e0b',
      'system'
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    void setup();
  }
}
