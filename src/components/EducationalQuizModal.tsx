import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { audioEngine } from '../game/audio';
import {
  EDUCATIONAL_QUESTIONS,
  EducationalQuestion,
  QUESTION_CATEGORIES,
  QuestionCategory,
} from '../game/educationalQuestions';

interface EducationalQuizModalProps {
  playerName: string;
  bankStars: number;
  answeredQuestionIds: string[];
  onClose: () => void;
  onAnswerCorrect: (question: EducationalQuestion) => void;
}

export function EducationalQuizModal({
  playerName,
  bankStars,
  answeredQuestionIds,
  onClose,
  onAnswerCorrect,
}: EducationalQuizModalProps) {
  const [category, setCategory] = useState<'all' | QuestionCategory>('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const questions = useMemo(() => {
    const pool =
      category === 'all'
        ? EDUCATIONAL_QUESTIONS
        : EDUCATIONAL_QUESTIONS.filter((q) => q.category === category);
    // Prioritize unanswered questions first so Talia always sees fresh challenges!
    const unanswered = pool.filter((q) => !answeredQuestionIds.includes(q.id));
    const answered = pool.filter((q) => answeredQuestionIds.includes(q.id));
    return [...unanswered, ...answered];
  }, [category, answeredQuestionIds]);

  const safeIdx = questions.length > 0 ? currentIdx % questions.length : 0;
  const activeQuestion = questions[safeIdx];
  const alreadyMastered = activeQuestion
    ? answeredQuestionIds.includes(activeQuestion.id)
    : false;

  const masteredCount = answeredQuestionIds.length;
  const totalCount = EDUCATIONAL_QUESTIONS.length;
  const masteredPct = Math.round((masteredCount / Math.max(1, totalCount)) * 100);

  const handleSelectCategory = (nextCat: 'all' | QuestionCategory) => {
    audioEngine.playClick();
    setCategory(nextCat);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleChooseOption = (idx: number) => {
    if (!activeQuestion || isCorrect === true) return;
    setSelectedOption(idx);
    if (idx === activeQuestion.correctIndex) {
      setIsCorrect(true);
      audioEngine.playStageUp();
      onAnswerCorrect(activeQuestion);
    } else {
      setIsCorrect(false);
      audioEngine.playHurt();
    }
  };

  const handleNext = () => {
    audioEngine.playClick();
    setCurrentIdx((prev) => prev + 1);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleRetry = () => {
    audioEngine.playClick();
    setSelectedOption(null);
    setIsCorrect(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1233]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edu-quiz-title"
    >
      <div className="animate-modal-pop flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E1EC] px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-[#0D9488]" />
            <h2 id="edu-quiz-title" className="font-display text-2xl font-bold text-[#3D1D42]">
              أسئلة تعليمية ممتعة
            </h2>
            <span className="text-sm font-medium text-[#7B4F70]">·</span>
            <span className="tabular-nums text-sm font-bold text-[#B45309]">
              نجوم {playerName}: {bankStars.toLocaleString('en-US')} ★
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الأسئلة التعليمية"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-white text-[#5A2450] transition-colors hover:bg-[#FFF0F6] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mastery Progress + Category Tabs */}
        <div className="border-b border-[#F7E8F0] bg-[#FFF8FB] px-6 py-3.5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#5A2450]">
              تقدّم المعرفة: أتقنتِ{' '}
              <strong className="tabular-nums text-[#0D9488]">
                {masteredCount} / {totalCount}
              </strong>{' '}
              سؤالاً
            </span>
            <div className="flex w-44 items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F3E1EC]">
                <div
                  className="h-full bg-gradient-to-l from-[#0D9488] to-[#F59E0B] transition-[width] duration-300"
                  style={{ width: `${masteredPct}%` }}
                />
              </div>
              <span className="tabular-nums text-xs font-bold text-[#3D1D42]">{masteredPct}%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`rounded-xl px-3 py-2 font-display text-xs font-bold transition-colors sm:text-sm ${
                  category === cat.id
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'border border-[#EAC5D8] bg-white text-[#5A2450] hover:bg-[#F0FDFA]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Question Card */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeQuestion && (
            <div className="flex flex-col gap-5 rounded-2xl border border-[#F0D9E5] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-2 text-[#0D9488]">
                  <span>{activeQuestion.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-[#75486A]">
                    سؤال {safeIdx + 1} من {questions.length}
                  </span>
                </div>

                {alreadyMastered ? (
                  <span className="inline-flex items-center gap-1 text-[#059669]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تم حلّه مسبقاً (مراجعة)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 tabular-nums text-[#B45309]">
                    <Sparkles className="h-4 w-4" />
                    <span>مكافأة الإجابة الصحيحة: +{activeQuestion.rewardStars} ★</span>
                  </span>
                )}
              </div>

              <h3 className="font-display text-xl leading-relaxed font-bold text-[#3D1D42] sm:text-2xl">
                {activeQuestion.question}
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeQuestion.options.map((option, idx) => {
                  const isChosen = selectedOption === idx;
                  const isRightChoice = idx === activeQuestion.correctIndex;

                  let btnStyle =
                    'border-[#EED2E1] bg-[#FFFDF9] text-[#3D1D42] hover:border-[#0D9488] hover:bg-[#F0FDFA]';
                  if (isCorrect === true && isRightChoice) {
                    btnStyle =
                      'border-[#10B981] bg-[#ECFDF5] text-[#065F46] ring-2 ring-[#10B981]';
                  } else if (isCorrect === false && isChosen) {
                    btnStyle =
                      'border-[#F43F5E] bg-[#FFF1F2] text-[#9F1239] ring-1 ring-[#F43F5E]';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isCorrect === true}
                      onClick={() => handleChooseOption(idx)}
                      className={`flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right font-display text-base font-bold transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#0D9488] ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isCorrect === true && isRightChoice && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#059669]" />
                      )}
                      {isCorrect === false && isChosen && (
                        <XCircle className="h-5 w-5 shrink-0 text-[#E11D48]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Box */}
              {isCorrect === true && (
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-display text-base font-extrabold text-[#065F46]">
                      إجابة رائعة يا {playerName}!
                      {!alreadyMastered ? ` (+${activeQuestion.rewardStars} ★)` : ''}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#047857]">
                      {activeQuestion.explanation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0D9488] px-5 py-2.5 font-display text-sm font-bold text-white shadow-sm hover:bg-[#0F766E]"
                  >
                    <span>السؤال التالي</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}

              {isCorrect === false && (
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 sm:flex-row sm:items-center">
                  <p className="text-sm font-bold text-[#9F1239]">
                    إجابة قريبة! فكّري قليلاً وجرّبي خياراً آخر يا {playerName}.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#FECDD3] bg-white px-4 py-2 font-display text-xs font-bold text-[#9F1239] hover:bg-[#FFE4E6]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>إعادة المحاولة</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-[#5A2450] px-4 py-2 font-display text-xs font-bold text-white hover:bg-[#3D1D42]"
                    >
                      <span>تخطي للسؤال التالي</span>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom quick skip when idle */}
              {isCorrect === null && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#75486A] hover:text-[#3D1D42]"
                  >
                    <span>عرض سؤال آخر</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
