import { ArrowUpCircle, CheckCircle2, Magnet, Shield, Zap } from 'lucide-react';
import {
  clampPowerLevel,
  getPowerUpgradeNextTier,
  POWER_UPGRADE_DEFINITIONS,
  PowerUpgradeId,
  PowerUpgrades,
} from '../game/types';

interface PowerUpgradesPanelProps {
  bankStars: number;
  powerUpgrades: PowerUpgrades;
  onUpgradePower: (id: PowerUpgradeId) => void;
}

export function PowerUpgradesPanel({
  bankStars,
  powerUpgrades,
  onUpgradePower,
}: PowerUpgradesPanelProps) {
  const renderIcon = (id: PowerUpgradeId) => {
    if (id === 'shield') return <Shield className="h-5 w-5 text-[#E11D74]" />;
    if (id === 'magnet') return <Magnet className="h-5 w-5 text-[#0284C7]" />;
    return <Zap className="h-5 w-5 text-[#D97706]" />;
  };

  return (
    <section className="flex flex-col gap-3.5">
      <p className="text-xs font-medium text-[#6B3A5E]">
        طوّري القوى السحرية الثلاث باستخدام النجوم لتزيد مدتها وفعاليتها داخل جميع العوالم وسباق
        الزمن.
      </p>

      <div className="flex flex-col gap-3">
        {POWER_UPGRADE_DEFINITIONS.map((def) => {
          const currentLevel = clampPowerLevel(powerUpgrades[def.id]);
          const currentTier = def.tiers.find((t) => t.level === currentLevel) || def.tiers[0];
          const nextTier = getPowerUpgradeNextTier(def.id, currentLevel);
          const isMax = !nextTier;
          const canAfford = nextTier ? bankStars >= nextTier.cost : false;

          return (
            <div
              key={def.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-[#EED2E1] bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/5"
                    style={{ backgroundColor: def.accentColor }}
                  >
                    {renderIcon(def.id)}
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base font-extrabold text-[#3D1D42]">
                        {def.name}
                      </h4>
                      <span className="text-xs font-medium text-[#8B5C80]">·</span>
                      <span className="tabular-nums text-xs font-extrabold text-[#9D174D]">
                        المستوى {currentLevel} / 5
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#6B3A5E]">{def.description}</p>
                  </div>
                </div>

                {isMax ? (
                  <span className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-extrabold text-[#059669]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>الحد الأقصى</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpgradePower(def.id)}
                    disabled={!canAfford}
                    className={`inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 font-display text-xs font-bold transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                      canAfford
                        ? 'bg-[#D97706] text-white shadow-sm hover:scale-[1.02] hover:bg-[#B45309] active:scale-95'
                        : 'cursor-not-allowed border border-[#E5DCE4] bg-[#F8F5F7] text-[#8B6280]'
                    }`}
                  >
                    <ArrowUpCircle className="h-4 w-4 shrink-0" />
                    <span className="tabular-nums">ترقية ({nextTier.cost} ★)</span>
                  </button>
                )}
              </div>

              {/* 5-segment Level Progress Indicator */}
              <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
                {def.tiers.map((t) => (
                  <div
                    key={t.level}
                    className="h-2 rounded-full transition-colors duration-150"
                    style={{
                      backgroundColor: t.level <= currentLevel ? def.primaryColor : '#F3E1EC',
                    }}
                  />
                ))}
              </div>

              {/* Current vs Next Level Quantitative Effects */}
              <div className="flex flex-col gap-1 text-xs">
                <p className="font-bold text-[#3D1D42]">
                  الحالي: <span className="font-medium text-[#5A2450]">{currentTier.effectLabel}</span>
                </p>
                {nextTier && (
                  <p className="font-bold text-[#0F766E]">
                    المستوى القادم ({nextTier.level}):{' '}
                    <span className="font-medium">{nextTier.effectLabel}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
