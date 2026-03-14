import options from './options';
import type { Roulette } from './roulette';

type WinnerMode = 'first' | 'last' | 'custom';

const storageKey = 'lunch_roulette_names';
const sampleRoster = ['Alex', 'Mina', 'Chris', 'Jae', 'Sora', 'Yuna', 'Noah', 'Hana'];
const winnerLines = [
  'Everyone else gets coffee. You get the bill.',
  'A dramatic finish and a very real cafe receipt.',
  'Lunch fate has spoken. Time to buy the round.',
  'The marble chose chaos and coffee at the same time.',
];

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
    const statusPill = query<HTMLElement>('#statusPill');
    const liveStatus = query<HTMLElement>('#liveStatus');
    const toastRoot = query<HTMLElement>('#toastRoot');

    let ready = false;
    let winnerMode: WinnerMode = 'first';
    let resetTimer = 0;

    const getRawNames = () =>
      rosterInput.value
        .split(/[,\r\n]/g)
        .map((value) => value.trim())
        .filter(Boolean);

    const setStatus = (pill: string, text: string) => {
      statusPill.textContent = pill;
      liveStatus.textContent = text;
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
      const merged = new Map<string, number>();

      getRawNames().forEach((token) => {
        const parsed = parseNameToken(token);
        if (!parsed.name) return;
        const key = parsed.weight > 1 ? `${parsed.name}/${parsed.weight}` : parsed.name;
        merged.set(key, (merged.get(key) ?? 0) + parsed.count);
      });

      rosterInput.value = [...merged.entries()].map(([key, count]) => (count > 1 ? `${key}*${count}` : key)).join('\n');
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
      const names = getRawNames();
      roulette.setMarbles(names);
      ready = names.length > 0;
      localStorage.setItem(storageKey, rosterInput.value.trim());

      if (winnerMode === 'last') {
        setWinnerRank(Math.max(1, roulette.getCount()));
      } else if (winnerMode === 'first') {
        setWinnerRank(1);
      } else {
        setWinnerRank(Number.parseInt(winningRankInput.value, 10) || 1);
      }

      startButton.disabled = !ready;
      setStatus(
        ready ? 'Board ready' : 'Waiting roster',
        ready
          ? `${roulette.getCount()} marbles loaded for the next coffee bet.`
          : 'Add at least one name to arm the board.'
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
      winnerMap.textContent = `Map: ${stage.title}`;
    };

    const startRound = () => {
      if (!ready) {
        showToast('Add a roster before starting the round.', '#ef4444');
        return;
      }

      if (resetTimer) {
        window.clearTimeout(resetTimer);
        resetTimer = 0;
      }

      resultPanel.hidden = true;
      clearFeed();
      startButton.disabled = true;
      roulette.start();
    };

    recordToggle.checked = options.autoRecording;
    skillToggle.checked = options.useSkills;
    themeToggle.checked = options.darkMode;
    syncTheme();

    const savedRoster = localStorage.getItem(storageKey)?.trim();
    rosterInput.value = savedRoster || sampleRoster.join('\n');

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
      rosterInput.value = sampleRoster.join('\n');
      refreshBoard();
      showToast('Sample lunch roster loaded.', '#38bdf8');
    });
    startButton.addEventListener('click', startRound);

    mapSelect.addEventListener('change', () => {
      roulette.setMap(Number(mapSelect.value));
      renderStage(roulette.getCurrentMap());
      refreshBoard();
    });

    firstWinnerButton.addEventListener('click', () => {
      winnerMode = 'first';
      setWinnerRank(1);
    });

    lastWinnerButton.addEventListener('click', () => {
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

    themeToggle.addEventListener('change', syncTheme);

    roulette.addEventListener('stagechange', (event) => {
      const detail = (event as CustomEvent<ReturnType<Roulette['getCurrentMap']>>).detail;
      renderStage(detail);
      appendFeedItem('Map ready', detail.flavor, detail.accent, 'system');
    });

    roulette.addEventListener('round-start', (event) => {
      const detail = (event as CustomEvent<ReturnType<Roulette['getCurrentMap']>>).detail;
      clearFeed();
      appendFeedItem('Round live', `Marbles released on ${detail.title}.`, detail.accent, 'system');
      setStatus('Round live', 'Watch the chaos. The next coffee sponsor is being decided.');
    });

    roulette.addEventListener('round-event', (event) => {
      const detail = (event as CustomEvent<{ title: string; description: string; accent: string }>).detail;
      appendFeedItem(detail.title, detail.description, detail.accent);
      showToast(detail.title, detail.accent);
    });

    roulette.addEventListener('goal', (event) => {
      const winner = (event as CustomEvent<{ winner: string }>).detail.winner;
      ready = false;
      startButton.disabled = true;
      winnerName.textContent = winner;
      winnerLine.textContent = randomOf(winnerLines);
      resultPanel.hidden = false;
      setStatus('Coffee sponsor', `${winner} got picked. One more round is ready soon.`);

      resetTimer = window.setTimeout(() => {
        refreshBoard();
      }, 2800);
    });

    roulette.addEventListener('message', (event) => {
      showToast((event as CustomEvent<string>).detail, '#fcd34d');
    });

    refreshBoard();
    appendFeedItem(
      'Lunch mode loaded',
      'Three office maps and random mid-round events are armed.',
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
