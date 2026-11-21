import { useState } from 'react';
import { X, Check, Lock } from 'lucide-react';
import {
  COMPANION_OPTIONS,
  CompanionId,
  CROWN_ITEMS,
  CrownId,
  FUR_COLORS,
  FurColorId,
  HORN_STYLES,
  HornStyleId,
  MANE_THEMES,
  ManeThemeId,
  PowerUpgradeId,
  SavedProgress,
  UNICORN_TRAITS,
  UnicornTraitId,
  WING_STYLES,
  WingStyleId,
} from '../game/types';
import { PowerUpgradesPanel } from './PowerUpgradesPanel';
import { UnicornPreviewCanvas } from './UnicornPreviewCanvas';

interface WardrobeModalProps {
  progress: SavedProgress;
  onClose: () => void;
  onSelectOrUnlockFur: (id: FurColorId) => void;
  onSelectOrUnlockMane: (id: ManeThemeId) => void;
  onSelectOrUnlockHorn: (id: HornStyleId) => void;
  onSelectOrUnlockWings: (id: WingStyleId) => void;
  onSelectOrUnlockCrown: (id: CrownId) => void;
  onSelectOrUnlockCompanion: (id: CompanionId) => void;
  onSelectOrUnlockTrait: (id: UnicornTraitId) => void;
  onUpgradePower: (id: PowerUpgradeId) => void;
}

type WardrobeTab = 'coat' | 'horn' | 'accessories' | 'companion' | 'trait' | 'powers';

export function WardrobeModal({
  progress,
  onClose,
  onSelectOrUnlockFur,
  onSelectOrUnlockMane,
  onSelectOrUnlockHorn,
  onSelectOrUnlockWings,
  onSelectOrUnlockCrown,
  onSelectOrUnlockCompanion,
  onSelectOrUnlockTrait,
  onUpgradePower,
}: WardrobeModalProps) {
  const [activeTab, setActiveTab] = useState<WardrobeTab>('coat');
  const equipped = progress.equipped;

  const tabs: { id: WardrobeTab; label: string }[] = [
    { id: 'coat', label: 'الفرو والشعر' },
    { id: 'horn', label: 'زخرفة القرن' },
    { id: 'accessories', label: 'الأجنحة والتيجان' },
    { id: 'companion', label: 'المرافق' },
    { id: 'trait', label: 'المهارة' },
    { id: 'powers', label: 'ترقية القوى' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1233]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wardrobe-title"
    >
      <div className="animate-modal-pop flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#F3D5E3] bg-[#FFFDF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E1EC] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 id="wardrobe-title" className="font-display text-2xl font-bold text-[#3D1D42]">
              تخصيص البطلة اليونيكورن
            </h2>
            <span className="text-sm font-medium text-[#7B4F70]">·</span>
            <span className="tabular-nums text-sm font-bold text-[#B45309]">
              رصيدك: {progress.bankStars.toLocaleString('en-US')} ★
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الاستوديو"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F3D5E3] bg-white text-[#5A2450] transition-colors hover:bg-[#FFF0F6] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[220px_1fr]">
          {/* Live Showcase */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F5E1EC] bg-gradient-to-b from-[#FFF2F8] to-[#FFFDF9] p-5 text-center">
            <UnicornPreviewCanvas customization={equipped} size={175} />
            <p className="mt-2 font-display text-lg font-bold text-[#3D1D42]">
              يونيكورن {progress.playerName}
            </p>
            <p className="mt-1 text-xs font-medium text-[#75486A]">
              {UNICORN_TRAITS.find((t) => t.id === equipped.traitId)?.perkLabel}
            </p>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1 rounded-xl bg-[#F8ECF2] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                    activeTab === tab.id
                      ? 'bg-white text-[#E11D74] shadow-sm'
                      : 'text-[#6A3B5E] hover:text-[#3D1D42]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'coat' && (
              <div className="flex flex-col gap-5">
                <section>
                  <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                    لون الفرو
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {FUR_COLORS.map((f) => {
                      const unlocked = progress.unlockedFurs.includes(f.id);
                      const active = equipped.furId === f.id;
                      const canAfford = progress.bankStars >= f.unlockCost;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onSelectOrUnlockFur(f.id)}
                          disabled={!unlocked && !canAfford}
                          className={`flex min-h-[54px] items-center justify-between rounded-xl border px-3 py-2 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                            active
                              ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                              : unlocked
                                ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                                : canAfford
                                  ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                  : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-5 w-5 shrink-0 rounded-full border border-[#D8B4C7]"
                              style={{ backgroundColor: f.bodyColor }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#3D1D42]">{f.name}</span>
                              {!unlocked && (
                                <span className="tabular-nums text-xs font-bold text-[#B45309]">
                                  {f.unlockCost} ★
                                </span>
                              )}
                            </div>
                          </div>
                          {active ? (
                            <Check className="h-4 w-4 text-[#E11D74]" />
                          ) : !unlocked ? (
                            <Lock className="h-3.5 w-3.5 text-[#B45309]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                    لون الشعر والذيل
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {MANE_THEMES.map((m) => {
                      const unlocked = progress.unlockedManes.includes(m.id);
                      const active = equipped.maneId === m.id;
                      const canAfford = progress.bankStars >= m.unlockCost;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onSelectOrUnlockMane(m.id)}
                          disabled={!unlocked && !canAfford}
                          className={`flex min-h-[54px] items-center justify-between rounded-xl border px-3 py-2.5 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                            active
                              ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                              : unlocked
                                ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                                : canAfford
                                  ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                  : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#3D1D42]">{m.name}</span>
                            {!unlocked && (
                              <span className="tabular-nums text-xs font-bold text-[#B45309]">
                                {m.unlockCost} ★
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {m.colors.map((c, idx) => (
                              <span
                                key={idx}
                                className="h-4 w-2 rounded-sm"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'horn' && (
              <section>
                <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                  زخرفة القرن السحري
                </h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {HORN_STYLES.map((h) => {
                    const unlocked = progress.unlockedHorns.includes(h.id);
                    const active = equipped.hornId === h.id;
                    const canAfford = progress.bankStars >= h.unlockCost;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => onSelectOrUnlockHorn(h.id)}
                        disabled={!unlocked && !canAfford}
                        className={`flex min-h-[60px] items-center justify-between rounded-2xl border px-4 py-3 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                          active
                            ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                            : unlocked
                              ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                              : canAfford
                                ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-6 w-3 rounded-t-full border border-black/10"
                            style={{
                              background: `linear-gradient(to top, ${h.baseColor}, ${h.tipColor})`,
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#3D1D42]">{h.name}</span>
                            {!unlocked && (
                              <span className="tabular-nums text-xs font-bold text-[#B45309]">
                                {h.unlockCost} ★
                              </span>
                            )}
                          </div>
                        </div>
                        {active ? (
                          <Check className="h-4 w-4 text-[#E11D74]" />
                        ) : !unlocked ? (
                          <Lock className="h-4 w-4 text-[#B45309]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'accessories' && (
              <div className="flex flex-col gap-5">
                <section>
                  <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                    شكل الأجنحة
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {WING_STYLES.map((w) => {
                      const unlocked = progress.unlockedWings.includes(w.id);
                      const active = equipped.wingId === w.id;
                      const canAfford = progress.bankStars >= w.unlockCost;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => onSelectOrUnlockWings(w.id)}
                          disabled={!unlocked && !canAfford}
                          className={`flex min-h-[54px] items-center justify-between rounded-xl border px-3 py-2.5 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                            active
                              ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                              : unlocked
                                ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                                : canAfford
                                  ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                  : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#3D1D42]">{w.name}</span>
                            {!unlocked && (
                              <span className="tabular-nums text-xs font-bold text-[#B45309]">
                                {w.unlockCost} ★
                              </span>
                            )}
                          </div>
                          {active ? (
                            <Check className="h-4 w-4 text-[#E11D74]" />
                          ) : !unlocked ? (
                            <Lock className="h-3.5 w-3.5 text-[#B45309]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                    التيجان والإكليل
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CROWN_ITEMS.map((c) => {
                      const unlocked = progress.unlockedCrowns.includes(c.id);
                      const active = equipped.crownId === c.id;
                      const canAfford = progress.bankStars >= c.unlockCost;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSelectOrUnlockCrown(c.id)}
                          disabled={!unlocked && !canAfford}
                          className={`flex min-h-[50px] items-center justify-between rounded-xl border px-3 py-2 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                            active
                              ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                              : unlocked
                                ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                                : canAfford
                                  ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                  : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                          }`}
                        >
                          <span className="text-sm font-bold text-[#3D1D42]">{c.name}</span>
                          {active ? (
                            <Check className="h-4 w-4 text-[#E11D74]" />
                          ) : !unlocked ? (
                            <span className="tabular-nums text-xs font-bold text-[#B45309]">
                              {c.unlockCost} ★
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'companion' && (
              <section>
                <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                  المرافق الطائر المساعد
                </h3>
                <div className="flex flex-col gap-2.5">
                  {COMPANION_OPTIONS.map((comp) => {
                    const unlocked = progress.unlockedCompanions.includes(comp.id);
                    const active = equipped.companionId === comp.id;
                    const canAfford = progress.bankStars >= comp.unlockCost;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => onSelectOrUnlockCompanion(comp.id)}
                        disabled={!unlocked && !canAfford}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                          active
                            ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                            : unlocked
                              ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                              : canAfford
                                ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-5 w-5 rounded-full border border-black/10"
                            style={{ backgroundColor: comp.primaryColor }}
                          />
                          <div className="flex flex-col">
                            <span className="font-display text-base font-bold text-[#3D1D42]">
                              {comp.name}
                            </span>
                            <span className="text-xs font-medium text-[#75486A]">
                              {comp.subtitle}
                            </span>
                          </div>
                        </div>
                        {active ? (
                          <Check className="h-5 w-5 text-[#E11D74]" />
                        ) : !unlocked ? (
                          <span className="inline-flex items-center gap-1 tabular-nums text-xs font-bold text-[#B45309]">
                            <Lock className="h-3.5 w-3.5" />
                            {comp.unlockCost} ★
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'trait' && (
              <section>
                <h3 className="mb-2.5 font-display text-base font-bold text-[#4C244E]">
                  قدرة اليونيكورن الخاصة
                </h3>
                <div className="flex flex-col gap-2.5">
                  {UNICORN_TRAITS.map((t) => {
                    const unlocked = progress.unlockedTraits.includes(t.id);
                    const active = equipped.traitId === t.id;
                    const canAfford = progress.bankStars >= t.unlockCost;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectOrUnlockTrait(t.id)}
                        disabled={!unlocked && !canAfford}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 text-right transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#E11D74] ${
                          active
                            ? 'border-[#E11D74] bg-[#FFF0F7] ring-1 ring-[#E11D74]'
                            : unlocked
                              ? 'border-[#EED2E1] bg-white hover:bg-[#FFF9FC]'
                              : canAfford
                                ? 'border-[#FCD34D] bg-[#FFFBEB]'
                                : 'cursor-not-allowed border-[#E5DCE4] bg-[#F8F5F7] opacity-65'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-display text-base font-bold text-[#3D1D42]">
                            {t.name}
                          </span>
                          <span className="text-xs font-medium text-[#75486A]">{t.perkLabel}</span>
                        </div>
                        {active ? (
                          <Check className="h-5 w-5 text-[#E11D74]" />
                        ) : !unlocked ? (
                          <span className="inline-flex items-center gap-1 tabular-nums text-xs font-bold text-[#B45309]">
                            <Lock className="h-3.5 w-3.5" />
                            {t.unlockCost} ★
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'powers' && (
              <PowerUpgradesPanel
                bankStars={progress.bankStars}
                powerUpgrades={progress.powerUpgrades}
                onUpgradePower={onUpgradePower}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#F5E1EC] bg-[#FFF9FC] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-[#E11D74] px-7 py-2 font-display text-base font-bold text-white transition-colors hover:bg-[#BE185D] focus-visible:outline-2 focus-visible:outline-[#E11D74]"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
