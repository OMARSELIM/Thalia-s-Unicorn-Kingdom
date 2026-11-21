import { useState } from 'react';
import { X, CheckCircle2, Sparkles, Compass, Puzzle, Trophy } from 'lucide-react';
import { audioEngine } from '../game/audio';
import {
  DailyChallengeDefinition,
  PuzzleType,
  QUEST_DEFINITIONS,
  QuestDefinition,
} from '../game/quests';
import { DailyChallengeProgress, REALM_DEFINITIONS, RealmId, SavedProgress } from '../game/types';

interface QuestsModalProps {
  progress: SavedProgress;
  dailyChallengeDef: DailyChallengeDefinition;
  dailyChallenge: DailyChallengeProgress;
  onClose: () => void;
  onGoToRealm: (realmId: RealmId) => void;
  onSolvePuzzle: (questId: string) => void;
  onClaimReward: (questId: string, rewardStars: number) => void;
  onClaimDailyReward: () => void;
}

export function QuestsModal({
  progress,
  dailyChallengeDef,
  dailyChallenge,
  onClose,
  onGoToRealm,
  onSolvePuzzle,
  onClaimReward,
  onClaimDailyReward,
}: QuestsModalProps) {
  const [activePuzzleQuest, setActivePuzzleQuest] = useState<QuestDefinition | null>(null);
  const dailyRealm = REALM_DEFINITIONS.find((r) => r.id === dailyChallengeDef.realmId);
  const dailyDone = dailyChallenge.progress >= dailyChallengeDef.targetCount;
  const dailyCanClaim = dailyDone && !dailyChallenge.claimed;
  const dailyPct = Math.min(
    100,
    Math.round((dailyChallenge.progress / dailyChallengeDef.targetCount) * 100)
  );
  const dailyUnit = dailyChallengeDef.metric === 'stars' ? 'نجمة' : 'م';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1233]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quests-title"
    >
      <div className="animate-modal-pop flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E1EC] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 id="quests-title" className="font-display text-2xl font-bold text-[#3D1D42]">
              مهام وألغاز المملكة
            </h2>
            <span className="text-sm font-medium text-[#7B4F70]">·</span>
            <span className="text-sm font-bold text-[#0D9488]">
              مغامرات {progress.playerName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق المهام"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-white text-[#5A2450] transition-colors hover:bg-[#FFF0F6] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activePuzzleQuest ? (
            <InteractivePuzzleView
              quest={activePuzzleQuest}
              onBack={() => setActivePuzzleQuest(null)}
              onComplete={() => {
                audioEngine.playStageUp();
                onSolvePuzzle(activePuzzleQuest.id);
                setActivePuzzleQuest(null);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3.5">
              {/* Daily Challenge Card */}
              <div
                className={`flex flex-col justify-between gap-3 rounded-2xl border-2 p-4 sm:flex-row sm:items-center ${
                  dailyChallenge.claimed
                    ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                    : dailyCanClaim
                      ? 'border-[#F59E0B] bg-[#FFFBEB]'
                      : 'border-[#F472B6]/60 bg-gradient-to-l from-[#FFF5F9] to-[#FFFDF7]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#9D174D]">
                    <span className="inline-flex items-center gap-1.5 font-display text-base font-extrabold text-[#3D1D42]">
                      <Trophy className="h-4 w-4 text-[#D97706]" />
                      <span>تحدي اليوم: {dailyChallengeDef.title}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{dailyRealm?.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#75486A]">يتجدد يومياً</span>
                  </div>

                  <p className="mt-1 text-sm leading-relaxed text-[#5A2450]">
                    {dailyChallengeDef.description}
                  </p>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F3E1EC]">
                      <div
                        className="h-full bg-gradient-to-l from-[#D97706] to-[#E11D74] transition-[width] duration-200"
                        style={{ width: `${dailyPct}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs font-bold text-[#3D1D42]">
                      {Math.min(dailyChallenge.progress, dailyChallengeDef.targetCount)} /{' '}
                      {dailyChallengeDef.targetCount} {dailyUnit}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <span className="tabular-nums text-xs font-extrabold text-[#B45309]">
                    مكافأة خاصة: +{dailyChallengeDef.rewardStars} ★
                  </span>

                  {dailyChallenge.claimed ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#059669]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>مكتمل لليوم</span>
                    </span>
                  ) : dailyCanClaim ? (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playStageUp();
                        onClaimDailyReward();
                      }}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#D97706] px-4 py-2 font-display text-sm font-bold text-white shadow-sm hover:bg-[#B45309]"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>استلام المكافأة الخاصة</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onGoToRealm(dailyChallengeDef.realmId)}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#E11D74] px-4 py-2 font-display text-sm font-bold text-white shadow-sm hover:bg-[#BE185D]"
                    >
                      <Compass className="h-4 w-4" />
                      <span>العب في {dailyRealm?.name}</span>
                    </button>
                  )}
                </div>
              </div>

              {QUEST_DEFINITIONS.map((q) => {
                const entry = progress.questProgress[q.id] || {
                  collected: 0,
                  puzzleSolved: false,
                  claimed: false,
                };
                const realm = REALM_DEFINITIONS.find((r) => r.id === q.realmId);
                const collectedDone = entry.collected >= q.targetCount;
                const needsPuzzle = Boolean(q.puzzleType) && !entry.puzzleSolved;
                const canClaim = collectedDone && !needsPuzzle && !entry.claimed;
                const pct = Math.min(100, Math.round((entry.collected / q.targetCount) * 100));

                return (
                  <div
                    key={q.id}
                    className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                      entry.claimed
                        ? 'border-[#D1FAE5] bg-[#F0FDF4]'
                        : canClaim
                          ? 'border-[#FCD34D] bg-[#FFFBEB]'
                          : 'border-[#F0D9E5] bg-white'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#75486A]">
                        <span className="font-display text-base font-extrabold text-[#3D1D42]">
                          {q.title}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{q.characterName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#9D174D]">{realm?.name}</span>
                      </div>

                      <p className="mt-1 text-sm leading-relaxed text-[#5A2450]">{q.storyText}</p>

                      {/* Progress Bar */}
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F3E1EC]">
                          <div
                            className="h-full bg-gradient-to-l from-[#E11D74] to-[#F59E0B] transition-[width] duration-200"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs font-bold text-[#3D1D42]">
                          {Math.min(entry.collected, q.targetCount)} / {q.targetCount}
                        </span>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <span className="tabular-nums text-xs font-extrabold text-[#B45309]">
                        المكافأة: +{q.rewardStars} ★
                      </span>

                      {entry.claimed ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#059669]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>مكتملة</span>
                        </span>
                      ) : canClaim ? (
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playGemPickup();
                            onClaimReward(q.id, q.rewardStars);
                          }}
                          className="inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#E11D74] px-4 py-2 font-display text-sm font-bold text-white shadow-sm hover:bg-[#BE185D]"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>استلام النجوم</span>
                        </button>
                      ) : collectedDone && needsPuzzle ? (
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playClick();
                            setActivePuzzleQuest(q);
                          }}
                          className="inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0D9488] px-4 py-2 font-display text-sm font-bold text-white shadow-sm hover:bg-[#0F766E]"
                        >
                          <Puzzle className="h-4 w-4" />
                          <span>حل اللغز الآن</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onGoToRealm(q.realmId)}
                          className="inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#EAC5D8] bg-[#FFF7FA] px-4 py-2 font-display text-sm font-bold text-[#5A2450] hover:bg-[#FFEBF3]"
                        >
                          <Compass className="h-4 w-4 text-[#E11D74]" />
                          <span>العب في {realm?.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InteractivePuzzleViewProps {
  quest: QuestDefinition;
  onBack: () => void;
  onComplete: () => void;
}

function InteractivePuzzleView({ quest, onBack, onComplete }: InteractivePuzzleViewProps) {
  const puzzleType: PuzzleType = quest.puzzleType || 'sequence';
  const [seqStep, setSeqStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);

  if (puzzleType === 'sequence') {
    const targetOrder = ['moon', 'star', 'lotus'];
    const choices = [
      { id: 'lotus', label: 'زهرة اللوتس', symbol: '❀' },
      { id: 'moon', label: 'القمر', symbol: '☽' },
      { id: 'star', label: 'النجمة', symbol: '★' },
    ];

    const handlePick = (id: string) => {
      if (id === targetOrder[seqStep]) {
        audioEngine.playStarPickup(seqStep + 2);
        setErrorMsg('');
        if (seqStep + 1 === targetOrder.length) {
          onComplete();
        } else {
          setSeqStep(seqStep + 1);
        }
      } else {
        audioEngine.playHurt();
        setErrorMsg('حاولي مرة أخرى! ابدئي بالقمر ثم النجمة ثم اللوتس.');
        setSeqStep(0);
      }
    };

    return (
      <div className="flex flex-col items-center rounded-2xl border border-[#F0D9E5] bg-[#FFF8FB] p-6 text-center">
        <h3 className="font-display text-xl font-bold text-[#3D1D42]">
          مساعدة {quest.characterName}
        </h3>
        <p className="mt-2 max-w-md text-sm font-medium text-[#5A2450]">{quest.puzzlePrompt}</p>

        <div className="my-5 flex items-center gap-3">
          {targetOrder.map((t, i) => (
            <div
              key={t}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-bold ${
                i < seqStep
                  ? 'border-[#0D9488] bg-[#CCFBF1] text-[#0F766E]'
                  : 'border-dashed border-[#D8B4C7] bg-white text-[#B894AB]'
              }`}
            >
              {i < seqStep ? (t === 'moon' ? '☽' : t === 'star' ? '★' : '❀') : i + 1}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              className="flex min-h-[54px] items-center gap-2 rounded-2xl border border-[#EAC5D8] bg-white px-5 py-3 font-display text-base font-bold text-[#3D1D42] shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl text-[#E11D74]">{c.symbol}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {errorMsg && <p className="mt-4 text-xs font-bold text-[#E11D48]">{errorMsg}</p>}
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm font-bold text-[#75486A] hover:underline"
        >
          العودة لقائمة المهام
        </button>
      </div>
    );
  }

  if (puzzleType === 'colorMatch') {
    const items = [
      { id: 'pink', flowerLabel: 'لوتس وردي', butterflyLabel: 'فراشة وردية', color: '#E11D74' },
      { id: 'gold', flowerLabel: 'لوتس ذهبي', butterflyLabel: 'فراشة ذهبية', color: '#F59E0B' },
      { id: 'teal', flowerLabel: 'لوتس فيروزي', butterflyLabel: 'فراشة فيروزية', color: '#0D9488' },
    ];
    const shuffledButterflies = [items[2], items[0], items[1]];

    const handleButterflyClick = (id: string) => {
      if (!selectedFlower) {
        setErrorMsg('اختاري زهرة أولاً ثم اختاري الفراشة المطابقة لها.');
        return;
      }
      if (selectedFlower === id) {
        audioEngine.playStarPickup(matchedPairs.length + 2);
        const next = [...matchedPairs, id];
        setMatchedPairs(next);
        setSelectedFlower(null);
        setErrorMsg('');
        if (next.length === items.length) {
          onComplete();
        }
      } else {
        audioEngine.playHurt();
        setErrorMsg('اللون غير مطابق! جرّبي اختيار نفس لون الزهرة.');
        setSelectedFlower(null);
      }
    };

    return (
      <div className="flex flex-col items-center rounded-2xl border border-[#F0D9E5] bg-[#FFF8FB] p-6 text-center">
        <h3 className="font-display text-xl font-bold text-[#3D1D42]">
          مساعدة {quest.characterName}
        </h3>
        <p className="mt-2 max-w-md text-sm font-medium text-[#5A2450]">{quest.puzzlePrompt}</p>

        <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-4">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-[#75486A]">١. اختاري الزهرة</span>
            {items.map((item) => {
              const done = matchedPairs.includes(item.id);
              const active = selectedFlower === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={done}
                  onClick={() => {
                    audioEngine.playClick();
                    setSelectedFlower(item.id);
                    setErrorMsg('');
                  }}
                  className={`flex min-h-[48px] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
                    done
                      ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#059669] opacity-75'
                      : active
                        ? 'border-[#E11D74] bg-[#FFF0F7] ring-2 ring-[#E11D74]'
                        : 'border-[#EED2E1] bg-white hover:bg-[#FFF5F9]'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.flowerLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-[#75486A]">٢. وصّليها بالفراشة</span>
            {shuffledButterflies.map((item) => {
              const done = matchedPairs.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={done}
                  onClick={() => handleButterflyClick(item.id)}
                  className={`flex min-h-[48px] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
                    done
                      ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#059669] opacity-75'
                      : 'border-[#EED2E1] bg-white hover:bg-[#FFF5F9]'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.butterflyLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && <p className="mt-4 text-xs font-bold text-[#E11D48]">{errorMsg}</p>}
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm font-bold text-[#75486A] hover:underline"
        >
          العودة لقائمة المهام
        </button>
      </div>
    );
  }

  // symbolOrder puzzle
  const symbolChoices = [
    { id: 'diamond', label: 'معين ◆' },
    { id: 'star', label: 'نجمة ★' },
    { id: 'moon', label: 'هلال ☽' },
  ];

  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#F0D9E5] bg-[#FFF8FB] p-6 text-center">
      <h3 className="font-display text-xl font-bold text-[#3D1D42]">
        مساعدة {quest.characterName}
      </h3>
      <p className="mt-3 rounded-xl bg-white px-5 py-3 font-display text-lg font-bold text-[#3D1D42] shadow-sm">
        {quest.puzzlePrompt}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {symbolChoices.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              if (opt.id === 'diamond') {
                onComplete();
              } else {
                audioEngine.playHurt();
                setErrorMsg('لاحظي النمط جيداً: نجمة ثم معين، نجمة ثم معين...');
              }
            }}
            className="min-h-[50px] rounded-2xl border border-[#EAC5D8] bg-white px-6 py-2.5 font-display text-base font-bold text-[#3D1D42] shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {errorMsg && <p className="mt-4 text-xs font-bold text-[#E11D48]">{errorMsg}</p>}
      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-bold text-[#75486A] hover:underline"
      >
        العودة لقائمة المهام
      </button>
    </div>
  );
}
