import { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Compass,
  Cloud,
  Trees,
  Flower2,
  Trophy,
  CheckCircle2,
  Landmark,
  Gem,
  Wind,
  Crown,
  Camera,
  Gift,
  BookOpen,
  Timer,
  Flag,
} from 'lucide-react';
import { DailyChallengeDefinition } from '../game/quests';
import {
  DailyChallengeProgress,
  GameMode,
  PlayerCustomization,
  REALM_DEFINITIONS,
  RealmId,
  UNICORN_TRAITS,
} from '../game/types';
import { UnicornPreviewCanvas } from './UnicornPreviewCanvas';

interface TitleScreenProps {
  playerName: string;
  selectedRealm: RealmId;
  gameMode: GameMode;
  customization: PlayerCustomization;
  bankStars: number;
  bestScore: number;
  readyQuestsCount: number;
  dailyChallengeDef: DailyChallengeDefinition;
  dailyChallenge: DailyChallengeProgress;
  muted: boolean;
  onSelectRealm: (realm: RealmId) => void;
  onSelectGameMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onStartDailyChallenge: () => void;
  onClaimDailyReward: () => void;
  onOpenWardrobe: () => void;
  onOpenQuests: () => void;
  memoriesCount: number;
  onOpenAlbum: () => void;
  earnedMedalsCount: number;
  onOpenGiftShop: () => void;
  unansweredQuestionsCount: number;
  onOpenQuiz: () => void;
  onToggleMute: () => void;
}

export function TitleScreen({
  playerName,
  selectedRealm,
  gameMode,
  customization,
  bankStars,
  bestScore,
  readyQuestsCount,
  dailyChallengeDef,
  dailyChallenge,
  muted,
  onSelectRealm,
  onSelectGameMode,
  onStartGame,
  onStartDailyChallenge,
  onClaimDailyReward,
  onOpenWardrobe,
  onOpenQuests,
  memoriesCount,
  onOpenAlbum,
  earnedMedalsCount,
  onOpenGiftShop,
  unansweredQuestionsCount,
  onOpenQuiz,
  onToggleMute,
}: TitleScreenProps) {
  const [imgError, setImgError] = useState(false);
  const currentTrait =
    UNICORN_TRAITS.find((t) => t.id === customization.traitId) || UNICORN_TRAITS[0];
  const dailyRealm = REALM_DEFINITIONS.find((r) => r.id === dailyChallengeDef.realmId);
  const dailyDone = dailyChallenge.progress >= dailyChallengeDef.targetCount;
  const dailyCanClaim = dailyDone && !dailyChallenge.claimed;
  const dailyUnit = dailyChallengeDef.metric === 'stars' ? '★' : 'م';

  const getRealmIcon = (id: RealmId) => {
    if (id === 'forest') return <Trees className="h-4 w-4 shrink-0 text-[#0D9488]" />;
    if (id === 'meadow') return <Flower2 className="h-4 w-4 shrink-0 text-[#D97706]" />;
    if (id === 'egypt') return <Landmark className="h-4 w-4 shrink-0 text-[#D97706]" />;
    if (id === 'qatar') return <Gem className="h-4 w-4 shrink-0 text-[#9D174D]" />;
    if (id === 'turkey') return <Wind className="h-4 w-4 shrink-0 text-[#0284C7]" />;
    if (id === 'pharaohs') return <Crown className="h-4 w-4 shrink-0 text-[#B45309]" />;
    return <Cloud className="h-4 w-4 shrink-0 text-[#E11D74]" />;
  };

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#FCE4EC] via-[#FFF0E6] to-[#F5D6E6]">
      {!imgError && (
        <img
          src="/src/assets/images/unicorn_sky_title_art_1795166557088.jpg"
          alt="مملكة تاليا لليونيكورن"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="animate-slow-drift pointer-events-none fixed inset-0 h-full w-full object-cover object-left"
        />
      )}

      {/* Measured contrast scrim over the calm right negative-space side */}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-t from-[#FFF7FA]/96 via-[#FFF7FA]/75 to-[#FFF7FA]/35 lg:bg-gradient-to-l lg:from-[#FFF8FB]/96 lg:via-[#FFF8FB]/86 lg:to-transparent"
        aria-hidden="true"
      />

      {/* Top-left Audio Mute Toggle */}
      <div className="fixed top-5 left-5 z-20">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-[#FFFDF9] text-[#6B2D5C] shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E11D74]"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Title Layout aligned to calm right space */}
      <div className="relative z-10 flex min-h-full w-full items-center justify-center px-5 py-6 lg:justify-start lg:px-14">
        <div className="flex w-full max-w-xl flex-col items-center text-center lg:items-start lg:text-right">
          {/* Personalized Greeting */}
          <p className="mb-1 text-sm font-bold text-[#9D174D]">
            أهلاً يا {playerName} · مغامرتك في انتظارك
          </p>

          {/* Bespoke Inline SVG Title Lockup */}
          <svg
            viewBox="0 0 460 110"
            className="mb-1 w-full max-w-[390px] overflow-visible drop-shadow-sm"
            role="img"
            aria-label="مملكة تاليا لليونيكورن"
          >
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BE185D" />
                <stop offset="55%" stopColor="#E11D74" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <path
              d="M42 18 Q 230 0 418 18"
              fill="none"
              stroke="#F472B6"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="6 6"
              opacity="0.65"
            />
            <polygon
              points="230,2 234,12 244,12 236,18 239,28 230,22 221,28 224,18 216,12 226,12"
              fill="#F59E0B"
            />
            <text
              x="230"
              y="76"
              textAnchor="middle"
              fill="url(#titleGrad)"
              style={{
                fontFamily: '"Baloo Bhaijaan 2", "Tajawal", sans-serif',
                fontWeight: 800,
                fontSize: '46px',
              }}
            >
              مملكة تاليا لليونيكورن
            </text>
            <text
              x="230"
              y="102"
              textAnchor="middle"
              fill="#6B3A5E"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              عوالم سحرية ومهام لأصدقاء المملكة
            </text>
          </svg>

          {/* Live Animated Unicorn Preview + Clean Stats */}
          <div className="my-2 flex items-center gap-4">
            <div className="animate-gentle-float">
              <UnicornPreviewCanvas customization={customization} size={116} />
            </div>
            <div className="flex flex-col items-start text-right">
              <span className="font-display text-lg font-bold text-[#3D1D42]">
                {currentTrait.name}
              </span>
              <span className="text-xs font-medium text-[#75486A] sm:text-sm">
                {currentTrait.perkLabel}
              </span>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#6A3B5E] sm:text-sm">
                <span>
                  أفضل نتيجة:{' '}
                  <strong className="tabular-nums font-bold text-[#3D1D42]">
                    {bestScore.toLocaleString('en-US')}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  النجوم:{' '}
                  <strong className="tabular-nums font-bold text-[#B45309]">
                    {bankStars.toLocaleString('en-US')} ★
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Daily Challenge Compact Strip */}
          <div
            className={`mb-3 flex w-full flex-col justify-between gap-2.5 rounded-2xl border px-4 py-2.5 text-right sm:flex-row sm:items-center ${
              dailyChallenge.claimed
                ? 'border-[#A7F3D0] bg-[#ECFDF5]/95'
                : dailyCanClaim
                  ? 'border-[#F59E0B] bg-[#FFFBEB]/95 shadow-sm'
                  : 'border-[#F3D5E3] bg-[#FFFDF9]/95 shadow-sm'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#9D174D]">
                <Trophy className="h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                <span className="font-display text-sm font-extrabold text-[#3D1D42]">
                  تحدي اليوم
                </span>
                <span aria-hidden="true">·</span>
                <span>{dailyRealm?.name}</span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-[#5A2450]">
                {dailyChallengeDef.description}
              </p>
              <p className="mt-0.5 tabular-nums text-[11px] font-bold text-[#75486A]">
                التقدم: {Math.min(dailyChallenge.progress, dailyChallengeDef.targetCount)} /{' '}
                {dailyChallengeDef.targetCount} {dailyUnit} · المكافأة +{dailyChallengeDef.rewardStars}{' '}
                ★
              </p>
            </div>

            {dailyChallenge.claimed ? (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-[#059669]">
                <CheckCircle2 className="h-4 w-4" />
                <span>مكتمل لليوم</span>
              </span>
            ) : dailyCanClaim ? (
              <button
                type="button"
                onClick={onClaimDailyReward}
                className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#D97706] px-4 py-2 font-display text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#B45309]"
              >
                <Sparkles className="h-4 w-4" />
                <span>استلام +{dailyChallengeDef.rewardStars} ★</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartDailyChallenge}
                className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#EAC5D8] bg-[#FFF3F8] px-3.5 py-2 font-display text-xs font-bold text-[#9D174D] transition-colors hover:bg-[#FFE4EF]"
              >
                <span>ابدئي التحدي</span>
              </button>
            )}
          </div>

          {/* Game Mode Switcher: Adventure vs Race Against Time */}
          <div className="mb-3 w-full">
            <p className="mb-1.5 text-xs font-bold text-[#5A2450]">اختاري نمط اللعب:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectGameMode('adventure')}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                  gameMode === 'adventure'
                    ? 'border-[#E11D74] bg-[#FFF0F7] text-[#9D174D] ring-1 ring-[#E11D74] shadow-sm'
                    : 'border-[#EED2E1] bg-[#FFFDF9]/95 text-[#5A2450] hover:bg-white'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-[#E11D74]" />
                <div className="flex flex-col items-start">
                  <span className="font-display text-sm font-extrabold">المغامرة الحرة</span>
                  <span className="text-[10px] font-medium opacity-80">زعماء وبوابات ونجوم</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectGameMode('timeTrial')}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#D97706] ${
                  gameMode === 'timeTrial'
                    ? 'border-[#D97706] bg-[#FFFBEB] text-[#92400E] ring-1 ring-[#F59E0B] shadow-sm'
                    : 'border-[#EED2E1] bg-[#FFFDF9]/95 text-[#5A2450] hover:bg-white'
                }`}
              >
                <Timer className="h-4 w-4 shrink-0 text-[#D97706]" />
                <div className="flex flex-col items-start">
                  <span className="font-display text-sm font-extrabold">السباق ضد الزمن</span>
                  <span className="text-[10px] font-medium opacity-80">صلي لنقطة النهاية سريعاً</span>
                </div>
              </button>
            </div>
          </div>

          {/* 7 Playable Environments Selector */}
          <div className="mb-4 w-full">
            <p className="mb-2 text-xs font-bold text-[#5A2450]">اختاري بيئة المغامرة:</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REALM_DEFINITIONS.map((realm, idx) => {
                const active = selectedRealm === realm.id;
                const isLastOdd = idx === REALM_DEFINITIONS.length - 1 && REALM_DEFINITIONS.length % 3 === 1;
                return (
                  <button
                    key={realm.id}
                    type="button"
                    onClick={() => onSelectRealm(realm.id)}
                    className={`flex flex-col items-start rounded-2xl border p-2.5 text-right transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                      isLastOdd ? 'col-span-2 sm:col-span-3' : ''
                    } ${
                      active
                        ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74] shadow-sm'
                        : 'border-[#EED2E1] bg-[#FFFDF9]/95 hover:bg-white'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1.5">
                      <span className="truncate font-display text-xs font-bold text-[#3D1D42] sm:text-sm">
                        {realm.name}
                      </span>
                      {getRealmIcon(realm.id)}
                    </div>
                    <span className="mt-1 line-clamp-1 text-[11px] leading-snug font-medium text-[#6F4365]">
                      {gameMode === 'timeTrial'
                        ? `الهدف: ${realm.timeTrialDistance} م · ${realm.timeTrialSeconds} ثانية`
                        : realm.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Start CTA + Wardrobe + Quests */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            <button
              type="button"
              onClick={onStartGame}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-7 py-3 font-display text-lg font-bold text-white shadow-md transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 ${
                gameMode === 'timeTrial'
                  ? 'bg-[#D97706] hover:bg-[#B45309] focus-visible:outline-[#D97706]'
                  : 'bg-[#E11D74] hover:bg-[#BE185D] focus-visible:outline-[#E11D74]'
              }`}
            >
              {gameMode === 'timeTrial' ? (
                <Flag className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
              <span>{gameMode === 'timeTrial' ? 'ابدئي السباق ضد الزمن' : 'ابدئي المغامرة'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuests}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#EAC5D8] bg-[#FFFDF9] px-5 py-3 font-display text-base font-bold text-[#5A2450] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#FFF3F8] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E11D74]"
            >
              <Compass className="h-5 w-5 text-[#0D9488]" />
              <span>
                المهام والألغاز
                {readyQuestsCount > 0 ? ` (${readyQuestsCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenWardrobe}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#EAC5D8] bg-[#FFFDF9] px-5 py-3 font-display text-base font-bold text-[#5A2450] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#FFF3F8] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E11D74]"
            >
              <Sparkles className="h-5 w-5 text-[#D97706]" />
              <span>تخصيص البطلة</span>
            </button>

            <button
              type="button"
              onClick={onOpenAlbum}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#EAC5D8] bg-[#FFFDF9] px-5 py-3 font-display text-base font-bold text-[#5A2450] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#FFF3F8] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E11D74]"
            >
              <Camera className="h-5 w-5 text-[#E11D74]" />
              <span>
                ألبوم الذكريات
                {memoriesCount > 0 ? ` (${memoriesCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenGiftShop}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#FCD34D] bg-[#FFFBEB] px-5 py-3 font-display text-base font-bold text-[#92400E] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#FEF3C7] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97706]"
            >
              <Gift className="h-5 w-5 text-[#D97706]" />
              <span>
                متجر الهدايا
                {earnedMedalsCount > 0 ? ` (${earnedMedalsCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenQuiz}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#99F6E4] bg-[#F0FDFA] px-5 py-3 font-display text-base font-bold text-[#0F766E] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#CCFBF1] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
            >
              <BookOpen className="h-5 w-5 text-[#0D9488]" />
              <span>
                أسئلة تعليمية
                {unansweredQuestionsCount > 0 ? ` (${unansweredQuestionsCount})` : ''}
              </span>
            </button>
          </div>

          {/* Single flat control-hint line */}
          <p className="mt-4 text-xs font-medium text-[#7B4F70]">
            Space / نقرة مطوّلة للقفز الأعلى (قفزة مزدوجة) · C / F لقفزة عالية · Shift للسرعة الخارقة
          </p>
        </div>
      </div>
    </div>
  );
}
