import {
  Pause,
  Volume2,
  VolumeX,
  Zap,
  ArrowUp,
  ArrowDown,
  Shield,
  Magnet,
  ChevronsUp,
  Timer,
  Flag,
} from 'lucide-react';
import { HudSnapshot, REALM_DEFINITIONS } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onDash: () => void;
  onJumpDown: () => void;
  onJumpUp: () => void;
  onHighJump: () => void;
  onDive: (held: boolean) => void;
}

export function GameHUD({
  hud,
  muted,
  onPause,
  onToggleMute,
  onDash,
  onJumpDown,
  onJumpUp,
  onHighJump,
  onDive,
}: GameHUDProps) {
  const dashReady = hud.dashCharge >= 0.999;
  const highJumpReady = hud.highJumpCharge >= 0.999;
  const speedPowerActive = hud.starRushTimer > 0 || hud.isDashing;
  const magnetActive = hud.magnetTimer > 0;
  const comboMult = Math.min(5, 1 + Math.floor(hud.combo / 3));
  const realm = REALM_DEFINITIONS.find((r) => r.id === hud.realmId);

  const speedPct =
    hud.starRushTimer > 0 && hud.starRushMaxTimer > 0
      ? Math.min(100, Math.round((hud.starRushTimer / hud.starRushMaxTimer) * 100))
      : Math.round(hud.dashCharge * 100);

  const magnetPct =
    magnetActive && hud.magnetMaxTimer > 0
      ? Math.min(100, Math.round((hud.magnetTimer / hud.magnetMaxTimer) * 100))
      : 0;

  const isTimeTrial = hud.gameMode === 'timeTrial';
  const ttRemaining = Math.max(0, hud.timeTrialRemaining);
  const ttIsWarning = isTimeTrial && ttRemaining > 5 && ttRemaining <= 10;
  const ttIsCritical = isTimeTrial && ttRemaining > 0 && ttRemaining <= 5;
  const ttTimePct =
    isTimeTrial && hud.timeTrialMaxTime > 0
      ? Math.max(0, Math.min(100, (ttRemaining / hud.timeTrialMaxTime) * 100))
      : 0;
  const ttDistPct =
    isTimeTrial && hud.timeTrialTargetDistance > 0
      ? Math.max(0, Math.min(100, (hud.distance / hud.timeTrialTargetDistance) * 100))
      : 0;
  const ttFormatted =
    ttRemaining <= 10
      ? `${ttRemaining.toFixed(1)} ث`
      : `00:${String(Math.ceil(ttRemaining)).padStart(2, '0')}`;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-5">
      {/* Urgent low-time perimeter glow */}
      {ttIsCritical && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 animate-pulse ring-4 ring-inset ring-[#E11D48]/40"
        />
      )}

      {/* Top Perimeter Clusters */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Top-Right Status Cluster */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#F3D5E3] bg-[#FFFDF9]/95 px-4 py-2.5 shadow-sm">
          {/* Hearts */}
          <div
            className="flex items-center gap-1"
            aria-label={`القلوب ${hud.hearts} من ${hud.maxHearts}`}
          >
            {Array.from({ length: hud.maxHearts }).map((_, idx) => {
              const filled = idx < hud.hearts;
              return (
                <svg
                  key={idx}
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 transition-transform duration-150 sm:h-6 sm:w-6 ${
                    filled ? 'scale-100 text-[#E11D74]' : 'scale-90 text-[#E5D5DF]'
                  }`}
                  fill={filled ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 21s-7-4.35-9.33-8.5C.8 9.2 2.4 5.5 6.2 5.5c2.1 0 3.7 1.15 4.8 2.6 1.1-1.45 2.7-2.6 4.8-2.6 3.8 0 5.4 3.7 3.53 7C19 16.65 12 21 12 21z" />
                </svg>
              );
            })}
          </div>

          <span className="text-[#D8B4C7]" aria-hidden="true">
            |
          </span>

          {/* Score */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-[#75486A]">النقاط</span>
            <span className="tabular-nums font-display text-xl font-extrabold text-[#3D1D42]">
              {hud.score.toLocaleString('en-US')}
            </span>
          </div>

          <span className="text-[#D8B4C7]" aria-hidden="true">
            ·
          </span>

          {/* Stars */}
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#F59E0B]" fill="currentColor">
              <path d="M12 2.5l2.85 5.78 6.38.93-4.61 4.5 1.09 6.35L12 17.06l-5.71 3 1.09-6.35-4.61-4.5 6.38-.93L12 2.5z" />
            </svg>
            <span className="tabular-nums font-display text-lg font-bold text-[#B45309]">
              {hud.starsCollected.toLocaleString('en-US')}
            </span>
          </div>

          <span className="hidden text-[#D8B4C7] sm:inline" aria-hidden="true">
            ·
          </span>
          <div className="hidden items-baseline gap-1 text-xs font-bold text-[#0D9488] sm:flex">
            <span className="tabular-nums">{hud.realmTokensCollected}</span>
            <span>{realm?.specialItemName}</span>
          </div>

          <span className="hidden text-[#D8B4C7] md:inline" aria-hidden="true">
            ·
          </span>
          <div className="hidden items-baseline gap-1.5 md:flex">
            <span className="tabular-nums text-sm font-bold text-[#5A2450]">
              {hud.distance} م
            </span>
            <span className="text-xs font-medium text-[#8B5C80]">· {hud.realmName}</span>
          </div>

          {comboMult > 1 && (
            <>
              <span className="text-[#D8B4C7]" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums font-display text-sm font-extrabold text-[#E11D74]">
                ×{comboMult} تتابع
              </span>
            </>
          )}

          {hud.secretZoneMode === 'none' && hud.trickStreak > 0 && (
            <>
              <span className="text-[#D8B4C7]" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums text-xs font-extrabold text-[#0D9488]">
                حركات {hud.trickStreak}/{hud.trickStreakTarget}
              </span>
            </>
          )}
        </div>

        {/* Top-Left Cluster: Magical Powers Status Icons + Utility Controls */}
        <div className="pointer-events-auto flex flex-wrap items-start justify-end gap-2">
          {/* Magical Powers Dock */}
          <div
            className="flex items-center gap-1.5 rounded-2xl border border-[#F3D5E3] bg-[#FFFDF9]/95 p-1.5 shadow-sm"
            aria-label="القوى السحرية"
          >
            {/* Power 1: Dash Boost (السرعة الخارقة) - Interactive trigger + active timer */}
            <button
              type="button"
              onClick={onDash}
              disabled={!dashReady}
              title="السرعة الخارقة (Shift / D)"
              className={`flex min-h-[42px] min-w-[92px] flex-col justify-between rounded-xl border px-2.5 py-1.5 text-right transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                speedPowerActive
                  ? 'border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] shadow-sm'
                  : dashReady
                    ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#B45309] hover:scale-[1.03] active:scale-95'
                    : 'border-[#EED2E1] bg-white text-[#8B6280]'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1.5">
                <Zap
                  className={`h-4 w-4 shrink-0 ${
                    speedPowerActive || dashReady
                      ? 'fill-[#F59E0B] text-[#D97706]'
                      : 'text-[#B894AB]'
                  }`}
                />
                <span className="tabular-nums text-[11px] font-extrabold whitespace-nowrap">
                  {hud.starRushTimer > 0
                    ? `مُفعّلة ${Math.ceil(hud.starRushTimer)}ث`
                    : hud.isDashing
                      ? 'منطلقة!'
                      : dashReady
                        ? 'جاهزة'
                        : `${speedPct}%`}
                </span>
              </div>
              <span className="mt-0.5 text-[10px] font-bold whitespace-nowrap">
                السرعة الخارقة
              </span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#F3E1EC]">
                <div
                  className="h-full bg-gradient-to-l from-[#E11D74] to-[#F59E0B] transition-[width] duration-75"
                  style={{ width: `${speedPct}%` }}
                />
              </div>
            </button>

            {/* Power 2: Magic Shield (الدرع السحري) */}
            <div
              className={`flex min-h-[42px] min-w-[84px] flex-col justify-between rounded-xl border px-2.5 py-1.5 text-right ${
                hud.shieldActive
                  ? 'border-[#E11D74] bg-[#FFF0F7] text-[#9D174D] shadow-sm'
                  : 'border-[#EED2E1] bg-white/80 text-[#9B7290]'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1.5">
                <Shield
                  className={`h-4 w-4 shrink-0 ${
                    hud.shieldActive ? 'fill-[#FBCFE8] text-[#E11D74]' : 'text-[#C9AFC0]'
                  }`}
                />
                <span className="tabular-nums text-[11px] font-extrabold whitespace-nowrap">
                  {hud.shieldActive
                    ? hud.shieldCharges > 1
                      ? `مُفعّل ×${hud.shieldCharges}`
                      : 'مُفعّل'
                    : 'غير مُفعّل'}
                </span>
              </div>
              <span className="mt-0.5 text-[10px] font-bold whitespace-nowrap">
                الدرع السحري
              </span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#F3E1EC]">
                <div
                  className="h-full bg-[#E11D74] transition-[width] duration-150"
                  style={{ width: hud.shieldActive ? '100%' : '0%' }}
                />
              </div>
            </div>

            {/* Power 3: Star Magnet (مغناطيس النجوم) */}
            <div
              className={`flex min-h-[42px] min-w-[88px] flex-col justify-between rounded-xl border px-2.5 py-1.5 text-right ${
                magnetActive
                  ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1] shadow-sm'
                  : 'border-[#EED2E1] bg-white/80 text-[#9B7290]'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1.5">
                <Magnet
                  className={`h-4 w-4 shrink-0 ${
                    magnetActive ? 'text-[#0284C7]' : 'text-[#C9AFC0]'
                  }`}
                />
                <span className="tabular-nums text-[11px] font-extrabold whitespace-nowrap">
                  {magnetActive ? `مُفعّل ${Math.ceil(hud.magnetTimer)}ث` : 'غير مُفعّل'}
                </span>
              </div>
              <span className="mt-0.5 text-[10px] font-bold whitespace-nowrap">
                مغناطيس النجوم
              </span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#E0EEF7]">
                <div
                  className="h-full bg-[#0284C7] transition-[width] duration-100"
                  style={{ width: `${magnetPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-[#FFFDF9]/95 text-[#5A2450] shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E11D74]"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={onPause}
              aria-label="إيقاف مؤقت"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-[#FFFDF9]/95 text-[#5A2450] shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E11D74]"
            >
              <Pause className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Race Against Time Countdown & Finish-Line Progress Card */}
      {isTimeTrial && (
        <div
          className={`mx-auto mt-2 flex w-full max-w-md flex-col rounded-2xl border px-4 py-2.5 shadow-md transition-colors duration-200 ${
            ttIsCritical
              ? 'animate-pulse border-[#E11D48] bg-[#FFF1F2]/95 text-[#9F1239]'
              : ttIsWarning
                ? 'border-[#F59E0B] bg-[#FFFBEB]/95 text-[#92400E]'
                : 'border-[#F3D5E3] bg-[#FFFDF9]/95 text-[#3D1D42]'
          }`}
          role="timer"
          aria-live="off"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Timer
                className={`h-5 w-5 shrink-0 ${
                  ttIsCritical
                    ? 'text-[#E11D48]'
                    : ttIsWarning
                      ? 'text-[#D97706]'
                      : 'text-[#E11D74]'
                }`}
              />
              <div className="flex flex-col text-right">
                <span className="font-display text-xs font-extrabold sm:text-sm">
                  {ttIsCritical
                    ? 'أسرعي يا تاليا! الوقت ينفد!'
                    : ttIsWarning
                      ? 'اقترب انتهاء الوقت!'
                      : 'السباق ضد الزمن'}
                </span>
                <span className="tabular-nums text-[11px] font-bold opacity-85">
                  المسافة: {Math.min(hud.distance, hud.timeTrialTargetDistance)} /{' '}
                  {hud.timeTrialTargetDistance} م
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 shrink-0 text-[#D97706]" />
              <span
                className={`tabular-nums font-display text-2xl font-extrabold tracking-tight ${
                  ttIsCritical
                    ? 'text-[#E11D48]'
                    : ttIsWarning
                      ? 'text-[#B45309]'
                      : 'text-[#3D1D42]'
                }`}
              >
                {ttFormatted}
              </span>
            </div>
          </div>

          {/* Remaining Time Bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3E1EC]">
            <div
              className={`h-full transition-[width] duration-75 ${
                ttIsCritical
                  ? 'bg-[#E11D48]'
                  : ttIsWarning
                    ? 'bg-gradient-to-l from-[#F59E0B] to-[#EA580C]'
                    : 'bg-gradient-to-l from-[#E11D74] to-[#F59E0B]'
              }`}
              style={{ width: `${ttTimePct}%` }}
            />
          </div>

          {/* Distance to Finish Line Progress Bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold opacity-80 whitespace-nowrap">نقطة النهاية</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFE4F7]">
              <div
                className="h-full bg-gradient-to-l from-[#0D9488] to-[#F59E0B] transition-[width] duration-100"
                style={{ width: `${ttDistPct}%` }}
              />
            </div>
            <span className="tabular-nums text-[10px] font-extrabold opacity-85">
              {Math.round(ttDistPct)}%
            </span>
          </div>
        </div>
      )}

      {/* Secret Zone Timer Bar */}
      {hud.secretZoneMode !== 'none' && (
        <div
          className={`mx-auto mt-2 flex w-full max-w-sm flex-col items-center rounded-2xl border bg-[#FFFDF9]/95 px-4 py-2 shadow-sm ${
            hud.secretZoneMode === 'bonus' ? 'border-[#FCD34D]' : 'border-[#5EEAD4]'
          }`}
        >
          <div className="flex w-full items-center justify-between text-xs font-bold text-[#3D1D42]">
            <span>
              {hud.secretZoneMode === 'bonus'
                ? 'منطقة المكافآت الذهبية'
                : 'مستوى التحدي السحري'}
            </span>
            <span className="tabular-nums text-[#B45309]">
              {Math.ceil(hud.secretZoneTimer)} ثانية
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#F3E1EC]">
            <div
              className={`h-full transition-[width] duration-100 ${
                hud.secretZoneMode === 'bonus'
                  ? 'bg-gradient-to-l from-[#F59E0B] to-[#E11D74]'
                  : 'bg-gradient-to-l from-[#0D9488] to-[#7E22CE]'
              }`}
              style={{
                width: `${
                  hud.secretZoneMaxTimer > 0
                    ? Math.max(0, Math.round((hud.secretZoneTimer / hud.secretZoneMaxTimer) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Unobtrusive Boss Encounter Bar */}
      {hud.bossActive && (
        <div className="mx-auto mt-2 flex w-full max-w-md flex-col items-center rounded-2xl border border-[#F3D5E3] bg-[#FFFDF9]/95 px-4 py-2.5 shadow-sm">
          <div className="flex w-full items-center justify-between gap-2 text-xs font-bold text-[#4C1D95]">
            <span>{hud.bossName}</span>
            <span className="text-[#B45309]">اجمعي النجوم لإضعاف درعه!</span>
          </div>
          <div className="mt-1.5 flex w-full items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EFE4F7]">
              <div
                className="h-full bg-gradient-to-l from-[#7E22CE] to-[#E11D74] transition-[width] duration-150"
                style={{ width: `${Math.round((hud.bossHp / hud.bossMaxHp) * 100)}%` }}
              />
            </div>
            <span className="tabular-nums text-xs font-extrabold text-[#4C1D95]">
              {hud.bossHp}/{hud.bossMaxHp}
            </span>
          </div>
          <div className="mt-1.5 flex w-full items-center gap-2">
            <span className="text-[11px] font-bold text-[#0D9488]">الدرع السحري</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#CCFBF1]">
              <div
                className="h-full bg-gradient-to-l from-[#0D9488] to-[#F59E0B] transition-[width] duration-150"
                style={{
                  width: `${
                    hud.bossMaxShield > 0
                      ? Math.round((hud.bossShield / hud.bossMaxShield) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="tabular-nums text-[11px] font-bold text-[#0D9488]">
              {hud.bossShield}/{hud.bossMaxShield} ★
            </span>
          </div>
        </div>
      )}

      {/* Bottom Controls (High Jump accessible on all screens, touch controls on mobile) */}
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onJumpDown();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onJumpUp();
            }}
            onPointerCancel={onJumpUp}
            onPointerLeave={onJumpUp}
            className="flex h-14 items-center gap-2 rounded-2xl border border-[#F3D5E3] bg-[#FFFDF9]/95 px-4 font-display text-sm font-bold text-[#E11D74] shadow-md active:scale-95 md:hidden"
          >
            <ArrowUp className="h-5 w-5" />
            <span>قفز</span>
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onHighJump();
            }}
            disabled={!highJumpReady}
            title="قفزة عالية (C أو F)"
            className={`flex h-12 items-center gap-1.5 rounded-2xl border px-4 font-display text-sm font-bold whitespace-nowrap shadow-md transition-transform active:scale-95 sm:h-14 sm:text-base ${
              highJumpReady
                ? 'border-[#E11D74] bg-[#FFF0F7] text-[#BE185D] hover:scale-[1.03]'
                : 'border-[#EED2E1] bg-[#FFFDF9]/90 text-[#9B7290]'
            }`}
          >
            <ChevronsUp className="h-5 w-5" />
            <span>قفزة عالية</span>
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDive(true);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onDive(false);
            }}
            onPointerCancel={() => onDive(false)}
            onPointerLeave={() => onDive(false)}
            aria-label="انزلاق سريع"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F3D5E3] bg-[#FFFDF9]/95 text-[#5A2450] shadow-md active:scale-95"
          >
            <ArrowDown className="h-5 w-5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDash();
            }}
            disabled={!dashReady}
            className={`flex h-14 items-center gap-2 rounded-2xl border px-5 font-display text-base font-bold shadow-md active:scale-95 ${
              dashReady
                ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]'
                : 'border-[#EED2E1] bg-[#FFFDF9]/90 text-[#9B7290]'
            }`}
          >
            <Zap className="h-5 w-5" />
            <span>سرعة خارقة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
