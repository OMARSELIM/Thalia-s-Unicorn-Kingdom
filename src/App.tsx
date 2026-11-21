import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { EducationalQuizModal } from './components/EducationalQuizModal';
import { GameHUD } from './components/GameHUD';
import { GameOverModal, PauseModal } from './components/GameModals';
import { GiftShopModal } from './components/GiftShopModal';
import { MemoryAlbumModal } from './components/MemoryAlbumModal';
import { QuestsModal } from './components/QuestsModal';
import { TitleScreen } from './components/TitleScreen';
import { WardrobeModal } from './components/WardrobeModal';
import { audioEngine } from './game/audio';
import { EDUCATIONAL_QUESTIONS, EducationalQuestion } from './game/educationalQuestions';
import { UnicornGameEngine } from './game/engine';
import { captureHeroDiscoverySnapshot } from './game/memorySnapshot';
import { getDailyChallengeForDate, getTodayDateKey, QUEST_DEFINITIONS } from './game/quests';
import {
  AccessoryId,
  clampPowerLevel,
  COMPANION_OPTIONS,
  CompanionId,
  CROWN_ITEMS,
  CrownId,
  DailyChallengeProgress,
  DEFAULT_POWER_UPGRADES,
  FUR_COLORS,
  FurColorId,
  GameMode,
  GameState,
  getPowerUpgradeNextTier,
  GIFT_ACCESSORIES,
  HORN_STYLES,
  HornStyleId,
  HudSnapshot,
  MANE_THEMES,
  ManeThemeId,
  MemoryPhoto,
  PowerUpgradeId,
  QuestProgressEntry,
  REALM_DEFINITIONS,
  RealmId,
  SavedProgress,
  UNICORN_TRAITS,
  UnicornTraitId,
  WING_STYLES,
  WingStyleId,
} from './game/types';

const STORAGE_KEY = 'talia_unicorn_kingdom_v2';

const DEFAULT_PROGRESS: SavedProgress = {
  playerName: 'تاليا عمر',
  selectedRealm: 'clouds',
  bankStars: 0,
  bestScore: 0,
  bestDistance: 0,
  unlockedTraits: ['luna'],
  unlockedFurs: ['pearl'],
  unlockedManes: ['rose'],
  unlockedHorns: ['spiral-gold'],
  unlockedWings: ['feathered', 'none'],
  unlockedCrowns: ['none'],
  unlockedAccessories: ['none'],
  unlockedCompanions: ['bird', 'none'],
  earnedMedals: [],
  equipped: {
    traitId: 'luna',
    furId: 'pearl',
    maneId: 'rose',
    hornId: 'spiral-gold',
    wingId: 'feathered',
    crownId: 'none',
    accessoryId: 'none',
    companionId: 'bird',
  },
  questProgress: {},
  dailyChallenge: {
    dateKey: getTodayDateKey(),
    progress: 0,
    claimed: false,
  },
  memories: [],
  answeredQuestionIds: [],
  powerUpgrades: { ...DEFAULT_POWER_UPGRADES },
  muted: false,
};

function normalizeDailyChallenge(
  entry: DailyChallengeProgress | undefined,
  todayKey: string = getTodayDateKey()
): DailyChallengeProgress {
  if (entry && entry.dateKey === todayKey) {
    return entry;
  }
  return {
    dateKey: todayKey,
    progress: 0,
    claimed: false,
  };
}

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const todayKey = getTodayDateKey();
    if (!raw) {
      return {
        ...DEFAULT_PROGRESS,
        dailyChallenge: normalizeDailyChallenge(undefined, todayKey),
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    const memories = Array.isArray(parsed.memories) ? parsed.memories : [];
    const savedMedals = Array.isArray(parsed.earnedMedals) ? parsed.earnedMedals : [];
    const memoryMedals = memories
      .filter((m) => m.category === 'boss')
      .map((m) => m.realmId);
    const mergedMedals = Array.from(new Set<RealmId>([...savedMedals, ...memoryMedals]));
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      playerName: 'تاليا عمر',
      equipped: {
        ...DEFAULT_PROGRESS.equipped,
        ...(parsed.equipped || {}),
      },
      questProgress: parsed.questProgress || {},
      dailyChallenge: normalizeDailyChallenge(parsed.dailyChallenge, todayKey),
      memories,
      answeredQuestionIds: Array.isArray(parsed.answeredQuestionIds)
        ? parsed.answeredQuestionIds
        : [],
      powerUpgrades: {
        shield: clampPowerLevel(parsed.powerUpgrades?.shield),
        speed: clampPowerLevel(parsed.powerUpgrades?.speed),
        magnet: clampPowerLevel(parsed.powerUpgrades?.magnet),
      },
      earnedMedals: mergedMedals,
      unlockedTraits: Array.isArray(parsed.unlockedTraits) ? parsed.unlockedTraits : ['luna'],
      unlockedFurs: Array.isArray(parsed.unlockedFurs) ? parsed.unlockedFurs : ['pearl'],
      unlockedManes: Array.isArray(parsed.unlockedManes) ? parsed.unlockedManes : ['rose'],
      unlockedHorns: Array.isArray(parsed.unlockedHorns) ? parsed.unlockedHorns : ['spiral-gold'],
      unlockedWings: Array.isArray(parsed.unlockedWings) ? parsed.unlockedWings : ['feathered', 'none'],
      unlockedCrowns: Array.isArray(parsed.unlockedCrowns) ? parsed.unlockedCrowns : ['none'],
      unlockedAccessories: Array.isArray(parsed.unlockedAccessories)
        ? parsed.unlockedAccessories
        : ['none'],
      unlockedCompanions: Array.isArray(parsed.unlockedCompanions)
        ? parsed.unlockedCompanions
        : ['bird', 'none'],
    };
  } catch {
    return {
      ...DEFAULT_PROGRESS,
      dailyChallenge: normalizeDailyChallenge(undefined),
    };
  }
}

function applyRunToDailyChallenge(
  prevEntry: DailyChallengeProgress | undefined,
  run: HudSnapshot,
  startedRealmId: RealmId
): DailyChallengeProgress {
  const todayKey = getTodayDateKey();
  const current = normalizeDailyChallenge(prevEntry, todayKey);
  if (current.claimed) return current;

  const def = getDailyChallengeForDate(todayKey);
  if (run.realmId !== def.realmId && startedRealmId !== def.realmId) {
    return current;
  }

  if (def.metric === 'stars') {
    return {
      ...current,
      progress: Math.min(def.targetCount, current.progress + run.starsCollected),
    };
  }

  return {
    ...current,
    progress: Math.min(def.targetCount, Math.max(current.progress, run.distance)),
  };
}

function applyRunToQuests(
  prevQuests: Record<string, QuestProgressEntry>,
  run: HudSnapshot
): Record<string, QuestProgressEntry> {
  const next = { ...prevQuests };
  for (const q of QUEST_DEFINITIONS) {
    if (q.realmId !== run.realmId) continue;
    const existing = next[q.id] || { collected: 0, puzzleSolved: false, claimed: false };
    if (existing.claimed) continue;

    let delta = 0;
    if (q.metric === 'stars') delta = run.starsCollected;
    else if (q.metric === 'realmTokens') delta = run.realmTokensCollected;
    else if (q.metric === 'gems') delta = run.gemsCollected;
    else if (q.metric === 'cloudsCleared') delta = run.cloudsCleared;
    else if (q.metric === 'distance') {
      next[q.id] = {
        ...existing,
        collected: Math.min(q.targetCount, Math.max(existing.collected, run.distance)),
      };
      continue;
    }

    next[q.id] = {
      ...existing,
      collected: Math.min(q.targetCount, existing.collected + delta),
    };
  }
  return next;
}

const INITIAL_HUD: HudSnapshot = {
  realmId: 'clouds',
  realmName: REALM_DEFINITIONS[0].name,
  gameMode: 'adventure',
  timeTrialRemaining: 0,
  timeTrialMaxTime: 0,
  timeTrialTargetDistance: REALM_DEFINITIONS[0].timeTrialDistance,
  timeTrialOutcome: 'none',
  timeTrialRewardStars: 0,
  score: 0,
  starsCollected: 0,
  realmTokensCollected: 0,
  gemsCollected: 0,
  distance: 0,
  hearts: 7,
  maxHearts: 7,
  combo: 0,
  dashCharge: 1,
  highJumpCharge: 1,
  isDashing: false,
  magnetTimer: 0,
  magnetMaxTimer: 6.5,
  shieldActive: false,
  shieldCharges: 0,
  starRushTimer: 0,
  starRushMaxTimer: 6.0,
  chestsOpened: 0,
  portalsEntered: 0,
  bossesDefeated: 0,
  tricksPerformed: 0,
  trickStreak: 0,
  trickStreakTarget: 3,
  secretZoneMode: 'none',
  secretZoneTimer: 0,
  secretZoneMaxTimer: 0,
  bossActive: false,
  bossName: REALM_DEFINITIONS[0].bossName,
  bossHp: 3,
  bossMaxHp: 3,
  bossShield: 4,
  bossMaxShield: 4,
  cloudsCleared: 0,
  newHighScore: false,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('adventure');
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [giftShopOpen, setGiftShopOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);
  const [progress, setProgress] = useState<SavedProgress>(loadProgress);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<UnicornGameEngine | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;
  const gameModeRef = useRef<GameMode>(gameMode);
  gameModeRef.current = gameMode;
  const modalOpenRef = useRef(false);
  modalOpenRef.current = wardrobeOpen || questsOpen || albumOpen || giftShopOpen || quizOpen;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const runStartRealmRef = useRef<RealmId>(progress.selectedRealm);

  useEffect(() => {
    audioEngine.setMuted(progress.muted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  useEffect(() => {
    if (!memoryToast) return;
    const t = window.setTimeout(() => setMemoryToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [memoryToast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new UnicornGameEngine(canvas, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onBossDefeatCapture: (payload) => {
        const memoryId = `boss:${payload.realmId}`;
        const alreadyHasMemory = progressRef.current.memories.some((m) => m.id === memoryId);
        const alreadyHasMedal = progressRef.current.earnedMedals.includes(payload.realmId);
        const newPhoto: MemoryPhoto | null = alreadyHasMemory
          ? null
          : {
              id: memoryId,
              category: 'boss',
              title: `هزيمة ${payload.bossName}`,
              subtitle: `انتصار في ${payload.realmName}`,
              realmId: payload.realmId,
              realmName: payload.realmName,
              imageDataUrl: payload.imageDataUrl,
              capturedAt: new Date().toISOString(),
              score: payload.score,
              distance: payload.distance,
            };

        if (!alreadyHasMemory || !alreadyHasMedal) {
          setProgress((prev) => {
            const nextMedals = prev.earnedMedals.includes(payload.realmId)
              ? prev.earnedMedals
              : [...prev.earnedMedals, payload.realmId];
            const nextMemories =
              newPhoto && !prev.memories.some((m) => m.id === memoryId)
                ? [newPhoto, ...prev.memories].slice(0, 24)
                : prev.memories;
            return {
              ...prev,
              earnedMedals: nextMedals,
              memories: nextMemories,
            };
          });
          setMemoryToast(
            !alreadyHasMedal
              ? `حصلتِ على ميدالية ${payload.bossName} وحُفظت اللقطة في الألبوم!`
              : `تم حفظ لقطة هزيمة ${payload.bossName} في ألبوم الذكريات!`
          );
        }
      },
      onGameOver: (finalSnapshot) => {
        setHud(finalSnapshot);
        setProgress((prev) => ({
          ...prev,
          bankStars: prev.bankStars + finalSnapshot.starsCollected,
          bestScore: Math.max(prev.bestScore, finalSnapshot.score),
          bestDistance: Math.max(prev.bestDistance, finalSnapshot.distance),
          questProgress: applyRunToQuests(prev.questProgress, finalSnapshot),
          dailyChallenge: applyRunToDailyChallenge(
            prev.dailyChallenge,
            finalSnapshot,
            runStartRealmRef.current
          ),
        }));
        setGameState('GAME_OVER');
      },
    });

    engineRef.current = engine;

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setCustomization(
      progress.equipped,
      progress.bestScore,
      progress.powerUpgrades
    );
  }, [progress.equipped, progress.bestScore, progress.powerUpgrades]);

  const todayKey = getTodayDateKey();
  const dailyChallengeDef = useMemo(() => getDailyChallengeForDate(todayKey), [todayKey]);
  const normalizedDaily = useMemo(
    () => normalizeDailyChallenge(progress.dailyChallenge, todayKey),
    [progress.dailyChallenge, todayKey]
  );

  const readyQuestsCount = useMemo(() => {
    const questReady = QUEST_DEFINITIONS.filter((q) => {
      const entry = progress.questProgress[q.id];
      if (!entry || entry.claimed) return false;
      return entry.collected >= q.targetCount;
    }).length;
    const dailyReady =
      !normalizedDaily.claimed && normalizedDaily.progress >= dailyChallengeDef.targetCount ? 1 : 0;
    return questReady + dailyReady;
  }, [progress.questProgress, normalizedDaily, dailyChallengeDef]);

  const startGameInRealm = useCallback((realmId?: RealmId, overrideMode?: GameMode) => {
    audioEngine.unlock();
    audioEngine.playClick();
    setWardrobeOpen(false);
    setQuestsOpen(false);
    setAlbumOpen(false);
    setGiftShopOpen(false);
    setQuizOpen(false);
    const chosenRealm = realmId || progressRef.current.selectedRealm;
    const chosenMode = overrideMode || gameModeRef.current;
    if (overrideMode) {
      setGameMode(overrideMode);
    }
    runStartRealmRef.current = chosenRealm;
    if (realmId) {
      setProgress((prev) => ({ ...prev, selectedRealm: realmId }));
    }
    setGameState('PLAYING');
    requestAnimationFrame(() => {
      engineRef.current?.resize();
      engineRef.current?.startNewRun(
        chosenRealm,
        progressRef.current.equipped,
        progressRef.current.bestScore,
        chosenMode,
        progressRef.current.powerUpgrades
      );
    });
  }, []);

  const pauseGame = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    audioEngine.playClick();
    engineRef.current?.setPaused(true);
    setGameState('PAUSED');
  }, []);

  const resumeGame = useCallback(() => {
    if (gameStateRef.current !== 'PAUSED') return;
    audioEngine.playClick();
    engineRef.current?.setPaused(false);
    setGameState('PLAYING');
  }, []);

  const backToTitle = useCallback(() => {
    audioEngine.playClick();
    engineRef.current?.stop();
    setWardrobeOpen(false);
    setQuestsOpen(false);
    setAlbumOpen(false);
    setGiftShopOpen(false);
    setQuizOpen(false);
    setGameState('TITLE_MENU');
  }, []);

  const toggleMute = useCallback(() => {
    setProgress((prev) => {
      const nextMuted = !prev.muted;
      audioEngine.setMuted(nextMuted);
      if (!nextMuted) {
        audioEngine.unlock();
        audioEngine.playClick();
      }
      return { ...prev, muted: nextMuted };
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (modalOpenRef.current) {
        if (e.key === 'Escape') {
          setWardrobeOpen(false);
          setQuestsOpen(false);
          setAlbumOpen(false);
          setGiftShopOpen(false);
          setQuizOpen(false);
        }
        return;
      }

      const state = gameStateRef.current;

      if (state === 'TITLE_MENU' || state === 'GAME_OVER') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGameInRealm();
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (state === 'PLAYING') pauseGame();
        else if (state === 'PAUSED') resumeGame();
        return;
      }

      if (state !== 'PLAYING') return;

      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (!e.repeat) {
          audioEngine.unlock();
          engineRef.current?.triggerJumpDown();
        }
      } else if (
        e.key === 'Shift' ||
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D' ||
        e.key === 'e' ||
        e.key === 'E'
      ) {
        e.preventDefault();
        if (!e.repeat) {
          audioEngine.unlock();
          engineRef.current?.triggerDash();
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        engineRef.current?.triggerDown(true);
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!e.repeat) {
          audioEngine.unlock();
          engineRef.current?.triggerHighJump();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engineRef.current?.triggerJumpUp();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engineRef.current?.triggerDown(false);
      }
    };

    const onBlur = () => engineRef.current?.clearInputs();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [pauseGame, resumeGame, startGameInRealm]);

  const handleSelectOrUnlockFur = (id: FurColorId) => {
    const item = FUR_COLORS.find((f) => f.id === id);
    if (!item) return;
    audioEngine.unlock();
    setProgress((prev) => {
      if (prev.unlockedFurs.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, furId: id } };
      }
      if (prev.bankStars >= item.unlockCost) {
        audioEngine.playGemPickup();
        return {
          ...prev,
          bankStars: prev.bankStars - item.unlockCost,
          unlockedFurs: [...prev.unlockedFurs, id],
          equipped: { ...prev.equipped, furId: id },
        };
      }
      return prev;
    });
  };

  const handleSelectOrUnlockMane = (id: ManeThemeId) => {
    const item = MANE_THEMES.find((m) => m.id === id);
    if (!item) return;
    audioEngine.unlock();
    setProgress((prev) => {
      if (prev.unlockedManes.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, maneId: id } };
      }
      if (prev.bankStars >= item.unlockCost) {
        audioEngine.playGemPickup();
        return {
          ...prev,
          bankStars: prev.bankStars - item.unlockCost,
          unlockedManes: [...prev.unlockedManes, id],
          equipped: { ...prev.equipped, maneId: id },
        };
      }
      return prev;
    });
  };

  const handleSelectOrUnlockHorn = (id: HornStyleId) => {
    const item = HORN_STYLES.find((h) => h.id === id);
    if (!item) return;
    audioEngine.unlock();
    setProgress((prev) => {
      if (prev.unlockedHorns.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, hornId: id } };
      }
      if (prev.bankStars >= item.unlockCost) {
        audioEngine.playGemPickup();
        return {
          ...prev,
          bankStars: prev.bankStars - item.unlockCost,
          unlockedHorns: [...prev.unlockedHorns, id],
          equipped: { ...prev.equipped, hornId: id },
        };
      }
      return prev;
    });
  };

  const handleSelectOrUnlockWings = (id: WingStyleId) => {
    const item = WING_STYLES.find((w) => w.id === id);
    if (!item) return;
    audioEngine.unlock();
    setProgress((prev) => {
      if (prev.unlockedWings.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, wingId: id } };
      }
      if (prev.bankStars >= item.unlockCost) {
        audioEngine.playGemPickup();
        return {
          ...prev,
          bankStars: prev.bankStars - item.unlockCost,
          unlockedWings: [...prev.unlockedWings, id],
          equipped: { ...prev.equipped, wingId: id },
        };
      }
      return prev;
    });
  };

  const handleSelectOrUnlockCrown = (id: CrownId) => {
    const item = CROWN_ITEMS.find((c) => c.id === id);
    if (!item) return;
    audioEngine.unlock();
    setProgress((prev) => {
      if (prev.unlockedCrowns.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, crownId: id } };
      }
      if (prev.bankStars >= item.unlockCost) {
        audioEngine.playGemPickup();
        return {
          ...prev,
          bankStars: prev.bankStars - item.unlockCost,
          unlockedCrowns: [...prev.unlockedCrowns, id],
          equipped: { ...prev.equipped, crownId: id },
        };
      }
      return prev;
    });
  };

  const handleSelectOrUnlockCompanion = (id: CompanionId) => {
    const item = COMPANION_OPTIONS.find((c) => c.id === id);
    if (!item) return;
    audioEngine.unlock();
    const current = progressRef.current;
    if (!current.unlockedCompanions.includes(id) && current.bankStars >= item.unlockCost) {
      audioEngine.playGemPickup();
      const nextEquipped = { ...current.equipped, companionId: id };
      const memoryId = `companion:${id}`;
      const realm =
        REALM_DEFINITIONS.find((r) => r.id === current.selectedRealm) || REALM_DEFINITIONS[0];
      const imageDataUrl = !current.memories.some((m) => m.id === memoryId)
        ? captureHeroDiscoverySnapshot(nextEquipped, realm.id, item.name)
        : '';
      const newMemory: MemoryPhoto | null = imageDataUrl
        ? {
            id: memoryId,
            category: 'hero',
            title: `اكتشاف المرافق: ${item.name}`,
            subtitle: item.subtitle,
            realmId: realm.id,
            realmName: realm.name,
            imageDataUrl,
            capturedAt: new Date().toISOString(),
          }
        : null;
      setProgress((prev) => ({
        ...prev,
        bankStars: prev.bankStars - item.unlockCost,
        unlockedCompanions: [...prev.unlockedCompanions, id],
        equipped: nextEquipped,
        memories:
          newMemory && !prev.memories.some((m) => m.id === newMemory.id)
            ? [newMemory, ...prev.memories].slice(0, 24)
            : prev.memories,
      }));
      if (newMemory) {
        setMemoryToast(`تم حفظ لقطة اكتشاف ${item.name} في ألبوم الذكريات!`);
      }
      return;
    }

    setProgress((prev) => {
      if (prev.unlockedCompanions.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, companionId: id } };
      }
      return prev;
    });
  };

  const handleSelectOrUnlockTrait = (id: UnicornTraitId) => {
    const item = UNICORN_TRAITS.find((t) => t.id === id);
    if (!item) return;
    audioEngine.unlock();
    const current = progressRef.current;
    if (!current.unlockedTraits.includes(id) && current.bankStars >= item.unlockCost) {
      audioEngine.playGemPickup();
      const nextEquipped = { ...current.equipped, traitId: id };
      const memoryId = `hero:${id}`;
      const realm =
        REALM_DEFINITIONS.find((r) => r.id === current.selectedRealm) || REALM_DEFINITIONS[0];
      const imageDataUrl = !current.memories.some((m) => m.id === memoryId)
        ? captureHeroDiscoverySnapshot(nextEquipped, realm.id, item.name)
        : '';
      const newMemory: MemoryPhoto | null = imageDataUrl
        ? {
            id: memoryId,
            category: 'hero',
            title: `اكتشاف البطلة: ${item.name}`,
            subtitle: item.perkLabel,
            realmId: realm.id,
            realmName: realm.name,
            imageDataUrl,
            capturedAt: new Date().toISOString(),
          }
        : null;
      setProgress((prev) => ({
        ...prev,
        bankStars: prev.bankStars - item.unlockCost,
        unlockedTraits: [...prev.unlockedTraits, id],
        equipped: nextEquipped,
        memories:
          newMemory && !prev.memories.some((m) => m.id === newMemory.id)
            ? [newMemory, ...prev.memories].slice(0, 24)
            : prev.memories,
      }));
      if (newMemory) {
        setMemoryToast(`تم حفظ لقطة اكتشاف ${item.name} في ألبوم الذكريات!`);
      }
      return;
    }

    setProgress((prev) => {
      if (prev.unlockedTraits.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, traitId: id } };
      }
      return prev;
    });
  };

  const handleDeleteMemory = (id: string) => {
    audioEngine.playClick();
    setProgress((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== id),
    }));
  };

  const handleSelectOrUnlockAccessory = (id: AccessoryId) => {
    const item = GIFT_ACCESSORIES.find((a) => a.id === id);
    if (!item) return;
    audioEngine.unlock();
    setProgress((prev) => {
      if (prev.unlockedAccessories.includes(id)) {
        audioEngine.playClick();
        return { ...prev, equipped: { ...prev.equipped, accessoryId: id } };
      }
      if (prev.bankStars >= item.unlockCost) {
        audioEngine.playGemPickup();
        return {
          ...prev,
          bankStars: prev.bankStars - item.unlockCost,
          unlockedAccessories: [...prev.unlockedAccessories, id],
          equipped: { ...prev.equipped, accessoryId: id },
        };
      }
      return prev;
    });
  };

  const handleUpgradePower = (id: PowerUpgradeId) => {
    audioEngine.unlock();
    setProgress((prev) => {
      const currentLevel = clampPowerLevel(prev.powerUpgrades[id]);
      const nextTier = getPowerUpgradeNextTier(id, currentLevel);
      if (!nextTier || prev.bankStars < nextTier.cost) {
        return prev;
      }
      audioEngine.playStageUp();
      return {
        ...prev,
        bankStars: prev.bankStars - nextTier.cost,
        powerUpgrades: {
          ...prev.powerUpgrades,
          [id]: nextTier.level,
        },
      };
    });
  };

  const handleAnswerEducationalQuestion = (question: EducationalQuestion) => {
    setProgress((prev) => {
      if (prev.answeredQuestionIds.includes(question.id)) {
        return prev;
      }
      return {
        ...prev,
        bankStars: prev.bankStars + question.rewardStars,
        answeredQuestionIds: [...prev.answeredQuestionIds, question.id],
      };
    });
  };

  const unansweredQuestionsCount = useMemo(
    () =>
      EDUCATIONAL_QUESTIONS.filter((q) => !progress.answeredQuestionIds.includes(q.id)).length,
    [progress.answeredQuestionIds]
  );

  const handleSolvePuzzle = (questId: string) => {
    setProgress((prev) => ({
      ...prev,
      questProgress: {
        ...prev.questProgress,
        [questId]: {
          ...(prev.questProgress[questId] || { collected: 0, puzzleSolved: false, claimed: false }),
          puzzleSolved: true,
        },
      },
    }));
  };

  const handleClaimQuestReward = (questId: string, rewardStars: number) => {
    setProgress((prev) => {
      const existing = prev.questProgress[questId];
      if (existing?.claimed) return prev;
      return {
        ...prev,
        bankStars: prev.bankStars + rewardStars,
        questProgress: {
          ...prev.questProgress,
          [questId]: {
            ...(existing || { collected: 0, puzzleSolved: true, claimed: false }),
            claimed: true,
          },
        },
      };
    });
  };

  const handleClaimDailyReward = () => {
    audioEngine.unlock();
    audioEngine.playStageUp();
    setProgress((prev) => {
      const currentKey = getTodayDateKey();
      const currentDaily = normalizeDailyChallenge(prev.dailyChallenge, currentKey);
      const currentDef = getDailyChallengeForDate(currentKey);
      if (currentDaily.claimed || currentDaily.progress < currentDef.targetCount) {
        return prev;
      }
      return {
        ...prev,
        bankStars: prev.bankStars + currentDef.rewardStars,
        dailyChallenge: {
          ...currentDaily,
          claimed: true,
        },
      };
    });
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1B1333]">
      <div
        className={`absolute inset-0 ${gameState === 'TITLE_MENU' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        onPointerDown={(e) => {
          if (gameState !== 'PLAYING') return;
          if (e.button === 2) {
            engineRef.current?.triggerDash();
            return;
          }
          audioEngine.unlock();
          engineRef.current?.triggerJumpDown();
        }}
        onPointerUp={() => {
          if (gameState === 'PLAYING') engineRef.current?.triggerJumpUp();
        }}
        onPointerCancel={() => engineRef.current?.triggerJumpUp()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />
      </div>

      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          playerName={progress.playerName}
          selectedRealm={progress.selectedRealm}
          gameMode={gameMode}
          customization={progress.equipped}
          powerUpgrades={progress.powerUpgrades}
          bankStars={progress.bankStars}
          bestScore={progress.bestScore}
          readyQuestsCount={readyQuestsCount}
          dailyChallengeDef={dailyChallengeDef}
          dailyChallenge={normalizedDaily}
          muted={progress.muted}
          onSelectRealm={(realm) => {
            audioEngine.unlock();
            audioEngine.playClick();
            setProgress((prev) => ({ ...prev, selectedRealm: realm }));
          }}
          onSelectGameMode={(mode) => {
            audioEngine.unlock();
            audioEngine.playClick();
            setGameMode(mode);
          }}
          onStartGame={() => startGameInRealm()}
          onStartDailyChallenge={() => startGameInRealm(dailyChallengeDef.realmId, 'adventure')}
          onClaimDailyReward={handleClaimDailyReward}
          onOpenWardrobe={() => {
            audioEngine.unlock();
            audioEngine.playClick();
            setWardrobeOpen(true);
          }}
          onOpenQuests={() => {
            audioEngine.unlock();
            audioEngine.playClick();
            setQuestsOpen(true);
          }}
          memoriesCount={progress.memories.length}
          onOpenAlbum={() => {
            audioEngine.unlock();
            audioEngine.playClick();
            setAlbumOpen(true);
          }}
          earnedMedalsCount={progress.earnedMedals.length}
          onOpenGiftShop={() => {
            audioEngine.unlock();
            audioEngine.playClick();
            setGiftShopOpen(true);
          }}
          unansweredQuestionsCount={unansweredQuestionsCount}
          onOpenQuiz={() => {
            audioEngine.unlock();
            audioEngine.playClick();
            setQuizOpen(true);
          }}
          onToggleMute={toggleMute}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameHUD
          hud={hud}
          muted={progress.muted}
          onPause={pauseGame}
          onToggleMute={toggleMute}
          onDash={() => {
            audioEngine.unlock();
            engineRef.current?.triggerDash();
          }}
          onJumpDown={() => {
            audioEngine.unlock();
            engineRef.current?.triggerJumpDown();
          }}
          onJumpUp={() => engineRef.current?.triggerJumpUp()}
          onHighJump={() => {
            audioEngine.unlock();
            engineRef.current?.triggerHighJump();
          }}
          onDive={(held) => engineRef.current?.triggerDown(held)}
        />
      )}

      {gameState === 'PAUSED' &&
        !wardrobeOpen &&
        !questsOpen &&
        !albumOpen &&
        !giftShopOpen &&
        !quizOpen && (
          <PauseModal
            onResume={resumeGame}
            onRestart={() => startGameInRealm()}
            onOpenWardrobe={() => {
              audioEngine.playClick();
              setWardrobeOpen(true);
            }}
            onOpenQuests={() => {
              audioEngine.playClick();
              setQuestsOpen(true);
            }}
            onBackToTitle={backToTitle}
          />
        )}

      {gameState === 'GAME_OVER' &&
        !wardrobeOpen &&
        !questsOpen &&
        !albumOpen &&
        !giftShopOpen &&
        !quizOpen && (
          <GameOverModal
            playerName={progress.playerName}
            snapshot={hud}
            bestScore={progress.bestScore}
            readyQuestsCount={readyQuestsCount}
            unansweredQuestionsCount={unansweredQuestionsCount}
            dailySummary={{
              title: dailyChallengeDef.title,
              progress: normalizedDaily.progress,
              target: dailyChallengeDef.targetCount,
              unit: dailyChallengeDef.metric === 'stars' ? '★' : 'م',
              completed: normalizedDaily.progress >= dailyChallengeDef.targetCount,
              claimed: normalizedDaily.claimed,
              rewardStars: dailyChallengeDef.rewardStars,
            }}
            onPlayAgain={() => startGameInRealm()}
            onOpenWardrobe={() => {
              audioEngine.playClick();
              setWardrobeOpen(true);
            }}
            onOpenQuests={() => {
              audioEngine.playClick();
              setQuestsOpen(true);
            }}
            onOpenQuiz={() => {
              audioEngine.playClick();
              setQuizOpen(true);
            }}
            onBackToTitle={backToTitle}
          />
        )}

      {wardrobeOpen && (
        <WardrobeModal
          progress={progress}
          onClose={() => {
            audioEngine.playClick();
            setWardrobeOpen(false);
          }}
          onSelectOrUnlockFur={handleSelectOrUnlockFur}
          onSelectOrUnlockMane={handleSelectOrUnlockMane}
          onSelectOrUnlockHorn={handleSelectOrUnlockHorn}
          onSelectOrUnlockWings={handleSelectOrUnlockWings}
          onSelectOrUnlockCrown={handleSelectOrUnlockCrown}
          onSelectOrUnlockCompanion={handleSelectOrUnlockCompanion}
          onSelectOrUnlockTrait={handleSelectOrUnlockTrait}
          onUpgradePower={handleUpgradePower}
        />
      )}

      {questsOpen && (
        <QuestsModal
          progress={progress}
          dailyChallengeDef={dailyChallengeDef}
          dailyChallenge={normalizedDaily}
          onClose={() => {
            audioEngine.playClick();
            setQuestsOpen(false);
          }}
          onGoToRealm={(realmId) => startGameInRealm(realmId)}
          onSolvePuzzle={handleSolvePuzzle}
          onClaimReward={handleClaimQuestReward}
          onClaimDailyReward={handleClaimDailyReward}
        />
      )}

      {albumOpen && (
        <MemoryAlbumModal
          playerName={progress.playerName}
          memories={progress.memories}
          onClose={() => {
            audioEngine.playClick();
            setAlbumOpen(false);
          }}
          onDeleteMemory={handleDeleteMemory}
        />
      )}

      {giftShopOpen && (
        <GiftShopModal
          progress={progress}
          onClose={() => {
            audioEngine.playClick();
            setGiftShopOpen(false);
          }}
          onSelectOrUnlockAccessory={handleSelectOrUnlockAccessory}
          onUpgradePower={handleUpgradePower}
        />
      )}

      {quizOpen && (
        <EducationalQuizModal
          playerName={progress.playerName}
          bankStars={progress.bankStars}
          answeredQuestionIds={progress.answeredQuestionIds}
          onClose={() => {
            audioEngine.playClick();
            setQuizOpen(false);
          }}
          onAnswerCorrect={handleAnswerEducationalQuestion}
        />
      )}

      {memoryToast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#F3D5E3] bg-[#FFFDF9]/95 px-4 py-2.5 text-sm font-bold text-[#3D1D42] shadow-lg"
        >
          <Camera className="h-4 w-4 shrink-0 text-[#E11D74]" />
          <span>{memoryToast}</span>
        </div>
      )}
    </main>
  );
}
