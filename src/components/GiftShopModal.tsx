import { useState } from 'react';
import { Award, Check, Gift, Lock, Sparkles, X, Zap } from 'lucide-react';
import {
  AccessoryId,
  BOSS_MEDALS,
  GIFT_ACCESSORIES,
  PowerUpgradeId,
  SavedProgress,
} from '../game/types';
import { PowerUpgradesPanel } from './PowerUpgradesPanel';
import { UnicornPreviewCanvas } from './UnicornPreviewCanvas';

interface GiftShopModalProps {
  progress: SavedProgress;
  onClose: () => void;
  onSelectOrUnlockAccessory: (id: AccessoryId) => void;
  onUpgradePower: (id: PowerUpgradeId) => void;
}

type GiftShopTab = 'accessories' | 'powers' | 'medals';

export function GiftShopModal({
  progress,
  onClose,
  onSelectOrUnlockAccessory,
  onUpgradePower,
}: GiftShopModalProps) {
  const [activeTab, setActiveTab] = useState<GiftShopTab>('accessories');
  const equippedAccessory = progress.equipped.accessoryId || 'none';
  const currentAccessoryObj =
    GIFT_ACCESSORIES.find((a) => a.id === equippedAccessory) || GIFT_ACCESSORIES[0];

  const earnedCount = progress.earnedMedals.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1233]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-shop-title"
    >
      <div className="animate-modal-pop flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E1EC] px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Gift className="h-6 w-6 text-[#D97706]" />
            <h2 id="gift-shop-title" className="font-display text-2xl font-bold text-[#3D1D42]">
              متجر الهدايا والميداليات
            </h2>
            <span className="text-sm font-medium text-[#7B4F70]">·</span>
            <span className="tabular-nums text-sm font-bold text-[#B45309]">
              رصيد {progress.playerName}: {progress.bankStars.toLocaleString('en-US')} ★
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق متجر الهدايا"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-white text-[#5A2450] transition-colors hover:bg-[#FFF0F6] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[230px_1fr]">
          {/* Left Showcase */}
          <div className="flex flex-col items-center justify-between rounded-2xl border border-[#F5E1EC] bg-gradient-to-b from-[#FFF5F9] to-[#FFFDF9] p-5 text-center">
            <div className="flex flex-col items-center">
              <UnicornPreviewCanvas customization={progress.equipped} size={175} />
              <p className="mt-2 font-display text-lg font-bold text-[#3D1D42]">
                إطلالة {progress.playerName}
              </p>
              <p className="mt-1 text-xs font-bold text-[#9D174D]">{currentAccessoryObj.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#75486A]">
                {currentAccessoryObj.description}
              </p>
            </div>

            <div className="mt-4 w-full rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#B45309]">
                <Award className="h-4 w-4 shrink-0" />
                <span>الميداليات المكتسبة</span>
              </div>
              <p className="mt-0.5 tabular-nums font-display text-lg font-extrabold text-[#3D1D42]">
                {earnedCount} / {BOSS_MEDALS.length}
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-5">
            {/* Section Switch Tabs */}
            <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#F8ECF2] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('accessories')}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 font-display text-xs font-bold transition-colors sm:text-sm ${
                  activeTab === 'accessories'
                    ? 'bg-white text-[#E11D74] shadow-sm'
                    : 'text-[#6A3B5E] hover:text-[#3D1D42]'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>إكسسوارات الزينة</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('powers')}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 font-display text-xs font-bold transition-colors sm:text-sm ${
                  activeTab === 'powers'
                    ? 'bg-white text-[#0D9488] shadow-sm'
                    : 'text-[#6A3B5E] hover:text-[#3D1D42]'
                }`}
              >
                <Zap className="h-4 w-4 shrink-0" />
                <span>تطوير القوى</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('medals')}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 font-display text-xs font-bold transition-colors sm:text-sm ${
                  activeTab === 'medals'
                    ? 'bg-white text-[#D97706] shadow-sm'
                    : 'text-[#6A3B5E] hover:text-[#3D1D42]'
                }`}
              >
                <Award className="h-4 w-4 shrink-0" />
                <span>
                  الميداليات ({earnedCount}/{BOSS_MEDALS.length})
                </span>
              </button>
            </div>

            {activeTab === 'accessories' ? (
              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium text-[#6B3A5E]">
                  اصرفي النجوم التي جمعتِها لشراء عقود وأوشحة وإكسسوارات زينة مميزة تظهر على
                  اليونيكورن في جميع العوالم.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {GIFT_ACCESSORIES.map((item) => {
                    const unlocked = progress.unlockedAccessories.includes(item.id);
                    const active = equippedAccessory === item.id;
                    const canAfford = progress.bankStars >= item.unlockCost;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectOrUnlockAccessory(item.id)}
                        disabled={!unlocked && !canAfford}
                        className={`flex min-h-[96px] flex-col justify-between rounded-2xl border p-4 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                          active
                            ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74] shadow-sm'
                            : unlocked
                              ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                              : canAfford
                                ? 'border-[#FCD34D] bg-[#FFFBEB] hover:bg-[#FEF3C7]/60'
                                : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-70'
                        }`}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/10 shadow-inner"
                              style={{
                                background: `linear-gradient(135deg, ${item.primaryColor}, ${item.accentColor})`,
                              }}
                            >
                              <Sparkles className="h-4 w-4 text-white drop-shadow" />
                            </span>
                            <span className="font-display text-base font-bold text-[#3D1D42]">
                              {item.name}
                            </span>
                          </div>

                          {active ? (
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#E11D74]">
                              <Check className="h-4 w-4" />
                              <span>مُجهّز</span>
                            </span>
                          ) : unlocked ? (
                            <span className="shrink-0 text-xs font-bold text-[#0D9488]">مملوك</span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-xs font-bold text-[#B45309]">
                              <Lock className="h-3.5 w-3.5" />
                              <span>{item.unlockCost} ★</span>
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-[#6B3A5E]">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : activeTab === 'powers' ? (
              <PowerUpgradesPanel
                bankStars={progress.bankStars}
                powerUpgrades={progress.powerUpgrades}
                onUpgradePower={onUpgradePower}
              />
            ) : (
              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium text-[#6B3A5E]">
                  ميداليات الشرف الملكية تُمنح تلقائياً لتاليا عند هزيمة كل زعيم في عوالم المملكة
                  السبعة.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BOSS_MEDALS.map((medal) => {
                    const earned = progress.earnedMedals.includes(medal.realmId);
                    return (
                      <div
                        key={medal.realmId}
                        className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
                          earned
                            ? 'border-[#FCD34D] bg-gradient-to-l from-[#FFFBEB] to-[#FFFDF9] shadow-sm'
                            : 'border-[#EAE0E7] bg-[#F8F5F7] opacity-75'
                        }`}
                      >
                        {/* Bespoke Inline SVG Medal Crest */}
                        <div className="shrink-0">
                          <svg
                            viewBox="0 0 56 68"
                            className="h-16 w-14"
                            aria-hidden="true"
                          >
                            {/* Ribbon */}
                            <polygon
                              points="14,0 24,0 28,24 18,24"
                              fill={earned ? medal.ribbonColor : '#CBD5E1'}
                            />
                            <polygon
                              points="42,0 32,0 28,24 38,24"
                              fill={earned ? medal.primaryColor : '#94A3B8'}
                            />
                            {/* Medal Disc */}
                            <circle
                              cx="28"
                              cy="42"
                              r="21"
                              fill={earned ? medal.primaryColor : '#E2E8F0'}
                              stroke={earned ? '#B45309' : '#94A3B8'}
                              strokeWidth="2.5"
                            />
                            <circle
                              cx="28"
                              cy="42"
                              r="15"
                              fill={earned ? '#FFFDF9' : '#F1F5F9'}
                              opacity="0.45"
                            />
                            {earned ? (
                              <polygon
                                points="28,30 31.5,38 40,39 33.8,44.8 35.4,53 28,48.8 20.6,53 22.2,44.8 16,39 24.5,38"
                                fill="#B45309"
                              />
                            ) : (
                              <rect
                                x="22"
                                y="39"
                                width="12"
                                height="10"
                                rx="2"
                                fill="#94A3B8"
                              />
                            )}
                          </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <h3 className="font-display text-base font-bold text-[#3D1D42]">
                              {medal.title}
                            </h3>
                            {earned ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669]">
                                <Check className="h-3.5 w-3.5" />
                                <span>مكتسبة</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#75486A]">
                                <Lock className="h-3 w-3" />
                                <span>مقفلة</span>
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-bold text-[#9D174D]">
                            {medal.realmName} · {medal.bossName}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#6B3A5E]">
                            {medal.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
