import { Play, RotateCcw, Sparkles, Home, Trophy, Compass, BookOpen, Flag, Timer } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenWardrobe: () => void;
  onOpenQuests: () => void;
  onBackToTitle: () => void;
}

export function PauseModal({
  onResume,
  onRestart,
  onOpenWardrobe,
  onOpenQuests,
  onBackToTitle,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1E1233]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="animate-modal-pop w-full max-w-sm rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] p-6 text-center shadow-2xl">
        <h2 id="pause-title" className="font-display text-2xl font-extrabold text-[#3D1D42]">
          استراحة قصيرة
        </h2>
        <p className="mt-1 text-sm font-medium text-[#75486A]">
          اليونيكورن مستعدة يا تاليا لما تكمّلي الرحلة
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E11D74] px-5 py-2.5 font-display text-lg font-bold text-white transition-colors hover:bg-[#BE185D] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>متابعة اللعب</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#EED2E1] bg-white px-5 py-2.5 font-display text-base font-bold text-[#4C244E] transition-colors hover:bg-[#FFF5F9] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>إعادة الرحلة</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenQuests}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-[#EED2E1] bg-white px-3 py-2 font-display text-sm font-bold text-[#4C244E] transition-colors hover:bg-[#FFF5F9]"
            >
              <Compass className="h-4 w-4 text-[#0D9488]" />
              <span>المهام</span>
            </button>
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-[#EED2E1] bg-white px-3 py-2 font-display text-sm font-bold text-[#4C244E] transition-colors hover:bg-[#FFF5F9]"
            >
              <Sparkles className="h-4 w-4 text-[#D97706]" />
              <span>تخصيص البطلة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToTitle}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-2 text-sm font-bold text-[#75486A] transition-colors hover:bg-[#FFF0F6] hover:text-[#3D1D42] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <Home className="h-4 w-4" />
            <span>القائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface DailySummaryProp {
  title: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
  claimed: boolean;
  rewardStars: number;
}

interface GameOverModalProps {
  playerName: string;
  snapshot: HudSnapshot;
  bestScore: number;
  readyQuestsCount: number;
  unansweredQuestionsCount: number;
  dailySummary?: DailySummaryProp;
  onPlayAgain: () => void;
  onOpenWardrobe: () => void;
  onOpenQuests: () => void;
  onOpenQuiz: () => void;
  onBackToTitle: () => void;
}

export function GameOverModal({
  playerName,
  snapshot,
  bestScore,
  readyQuestsCount,
  unansweredQuestionsCount,
  dailySummary,
  onPlayAgain,
  onOpenWardrobe,
  onOpenQuests,
  onOpenQuiz,
  onBackToTitle,
}: GameOverModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1E1233]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="animate-modal-pop w-full max-w-md rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] p-6 text-center shadow-2xl sm:p-7">
        {snapshot.gameMode === 'timeTrial' && snapshot.timeTrialOutcome === 'won' && (
          <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#059669]">
            <Flag className="h-4 w-4" />
            <span>أنجزتِ سباق الزمن بنجاح يا {playerName}!</span>
          </div>
        )}

        {snapshot.gameMode === 'timeTrial' && snapshot.timeTrialOutcome !== 'won' && (
          <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#E11D48]">
            <Timer className="h-4 w-4" />
            <span>سباق الزمن · حاولي مجدداً</span>
          </div>
        )}

        {snapshot.newHighScore && (
          <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#D97706]">
            <Trophy className="h-4 w-4" />
            <span>رقم قياسي جديد يا {playerName}!</span>
          </div>
        )}

        <h2 id="gameover-title" className="font-display text-3xl font-extrabold text-[#3D1D42]">
          {snapshot.gameMode === 'timeTrial'
            ? snapshot.timeTrialOutcome === 'won'
              ? 'وصلتِ لنقطة النهاية!'
              : snapshot.timeTrialOutcome === 'timeout'
                ? 'انتهى الوقت!'
                : 'انتهى السباق!'
            : 'مغامرة مدهشة!'}
        </h2>
        <p className="mt-1 text-sm font-medium text-[#75486A]">
          {snapshot.gameMode === 'timeTrial'
            ? snapshot.timeTrialOutcome === 'won'
              ? `في ${snapshot.realmName} · تبقّى ${Math.max(1, Math.ceil(snapshot.timeTrialRemaining))} ثانية · مكافأة السباق +${snapshot.timeTrialRewardStars} ★`
              : `في ${snapshot.realmName} · تبقّى ${Math.max(0, snapshot.timeTrialTargetDistance - snapshot.distance)} متر عن نقطة النهاية`
            : `في ${snapshot.realmName}`}
        </p>

        {/* Clean Stats Breakdown */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#F5E1EC] bg-[#FFF7FA] p-4">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#75486A]">النقاط النهائية</span>
            <span className="tabular-nums font-display text-2xl font-extrabold text-[#E11D74]">
              {snapshot.score.toLocaleString('en-US')}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#75486A]">النجوم المجموعة</span>
            <span className="tabular-nums font-display text-2xl font-extrabold text-[#B45309]">
              +{snapshot.starsCollected.toLocaleString('en-US')} ★
            </span>
          </div>
          <div className="flex flex-col items-center border-t border-[#F3DCE8] pt-3">
            <span className="text-xs font-bold text-[#75486A]">المسافة</span>
            <span className="tabular-nums text-base font-bold text-[#3D1D42]">
              {snapshot.distance} م
            </span>
          </div>
          <div className="flex flex-col items-center border-t border-[#F3DCE8] pt-3">
            <span className="text-xs font-bold text-[#75486A]">أفضل نتيجة</span>
            <span className="tabular-nums text-base font-bold text-[#3D1D42]">
              {Math.max(bestScore, snapshot.score).toLocaleString('en-US')}
            </span>
          </div>
        </div>

        {/* Adventure Highlights Metadata */}
        <p className="mt-3 text-xs font-bold text-[#6A3B5E]">
          كنوز: <span className="tabular-nums">{snapshot.chestsOpened}</span> · بوابات:{' '}
          <span className="tabular-nums">{snapshot.portalsEntered}</span> · شقلبات:{' '}
          <span className="tabular-nums">{snapshot.tricksPerformed}</span> · زعماء:{' '}
          <span className="tabular-nums">{snapshot.bossesDefeated}</span>
        </p>

        {dailySummary && (
          <p className="mt-1.5 tabular-nums text-xs font-bold text-[#9D174D]">
            تحدي اليوم ({dailySummary.title}):{' '}
            {Math.min(dailySummary.progress, dailySummary.target)} / {dailySummary.target}{' '}
            {dailySummary.unit}
            {dailySummary.claimed
              ? ' · مكتمل ✓'
              : dailySummary.completed
                ? ` · جاهز للاستلام (+${dailySummary.rewardStars} ★)`
                : ''}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#E11D74] px-6 py-3 font-display text-lg font-bold text-white shadow-md transition-transform duration-150 hover:scale-[1.02] hover:bg-[#BE185D] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <RotateCcw className="h-5 w-5" />
            <span>العب مجدداً</span>
          </button>

          <button
            type="button"
            onClick={onOpenQuiz}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#99F6E4] bg-[#F0FDFA] px-5 py-2.5 font-display text-sm font-bold text-[#0F766E] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-2 focus-visible:outline-[#0D9488]"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>
              سؤال تعليمي لربح نجوم إضافية (+15 ★)
              {unansweredQuestionsCount > 0 ? ` · ${unansweredQuestionsCount} متاح` : ''}
            </span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onOpenQuests}
              className="flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-2xl border border-[#EED2E1] bg-white px-2.5 py-2 font-display text-xs font-bold text-[#4C244E] transition-colors hover:bg-[#FFF5F9] sm:text-sm"
            >
              <Compass className="h-4 w-4 text-[#0D9488]" />
              <span>المهام{readyQuestsCount > 0 ? ` (${readyQuestsCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={onOpenWardrobe}
              className="flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-2xl border border-[#EED2E1] bg-white px-2.5 py-2 font-display text-xs font-bold text-[#4C244E] transition-colors hover:bg-[#FFF5F9] sm:text-sm"
            >
              <Sparkles className="h-4 w-4 text-[#D97706]" />
              <span>تخصيص البطلة</span>
            </button>

            <button
              type="button"
              onClick={onBackToTitle}
              className="flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-2xl border border-[#EED2E1] bg-white px-2.5 py-2 font-display text-xs font-bold text-[#4C244E] transition-colors hover:bg-[#FFF5F9] sm:text-sm"
            >
              <Home className="h-4 w-4" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
