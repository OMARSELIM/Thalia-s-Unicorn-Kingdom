export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
export type GameMode = 'adventure' | 'timeTrial';

export type RealmId = 'clouds' | 'forest' | 'meadow' | 'egypt' | 'qatar' | 'turkey' | 'pharaohs';

export type UnicornTraitId = 'luna' | 'sama' | 'najma';
export type FurColorId = 'pearl' | 'blush' | 'sky' | 'honey' | 'lilac';
export type ManeThemeId = 'rose' | 'nile' | 'golden' | 'lavender' | 'lotus';
export type HornStyleId = 'spiral-gold' | 'crystal-aqua' | 'pearl-rose' | 'star-glow';
export type WingStyleId = 'feathered' | 'butterfly' | 'crystal' | 'none';
export type CrownId = 'none' | 'flower' | 'star' | 'crystal';
export type AccessoryId =
  | 'none'
  | 'pearl-necklace'
  | 'rose-ribbon'
  | 'nile-collar'
  | 'star-anklet'
  | 'lotus-brooch';
export type CompanionId = 'bird' | 'butterfly' | 'none';
export type PowerUpgradeId = 'shield' | 'speed' | 'magnet';

export interface PowerUpgrades {
  shield: number; // 1..5
  speed: number; // 1..5
  magnet: number; // 1..5
}

export interface PowerUpgradeTier {
  level: number;
  cost: number;
  effectLabel: string;
}

export interface PowerUpgradeDefinition {
  id: PowerUpgradeId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  tiers: PowerUpgradeTier[];
}

export interface RealmDefinition {
  id: RealmId;
  name: string;
  subtitle: string;
  challengeNote: string;
  specialItemName: string;
  bossName: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  farLayerColor: string;
  nearLayerColor: string;
  platformMain: string;
  platformShadow: string;
  bouncyColor: string;
  accentColor: string;
  starOpacity: number;
  timeTrialDistance: number;
  timeTrialSeconds: number;
}

export interface UnicornTrait {
  id: UnicornTraitId;
  name: string;
  perkLabel: string;
  glideGravityFactor: number;
  magnetRadiusBonus: number;
  dashCooldownFactor: number;
  unlockCost: number;
}

export interface FurColorOption {
  id: FurColorId;
  name: string;
  bodyColor: string;
  bellyColor: string;
  hoofColor: string;
  eyeColor: string;
  unlockCost: number;
}

export interface ManeTheme {
  id: ManeThemeId;
  name: string;
  colors: [string, string, string, string];
  unlockCost: number;
}

export interface HornStyleOption {
  id: HornStyleId;
  name: string;
  baseColor: string;
  tipColor: string;
  accentColor: string;
  unlockCost: number;
}

export interface WingStyleOption {
  id: WingStyleId;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  unlockCost: number;
}

export interface CrownItem {
  id: CrownId;
  name: string;
  unlockCost: number;
}

export interface CompanionOption {
  id: CompanionId;
  name: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  unlockCost: number;
}

export interface GiftAccessory {
  id: AccessoryId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  unlockCost: number;
}

export interface BossMedal {
  realmId: RealmId;
  title: string;
  bossName: string;
  realmName: string;
  description: string;
  primaryColor: string;
  ribbonColor: string;
}

export interface PlayerCustomization {
  traitId: UnicornTraitId;
  furId: FurColorId;
  maneId: ManeThemeId;
  hornId: HornStyleId;
  wingId: WingStyleId;
  crownId: CrownId;
  accessoryId?: AccessoryId;
  companionId: CompanionId;
}

export interface QuestProgressEntry {
  collected: number;
  puzzleSolved: boolean;
  claimed: boolean;
}

export interface DailyChallengeProgress {
  dateKey: string;
  progress: number;
  claimed: boolean;
}

export type MemoryCategory = 'boss' | 'hero';

export interface MemoryPhoto {
  id: string;
  category: MemoryCategory;
  title: string;
  subtitle: string;
  realmId: RealmId;
  realmName: string;
  imageDataUrl: string;
  capturedAt: string;
  score?: number;
  distance?: number;
}

export interface SavedProgress {
  playerName: string;
  selectedRealm: RealmId;
  bankStars: number;
  bestScore: number;
  bestDistance: number;
  unlockedTraits: UnicornTraitId[];
  unlockedFurs: FurColorId[];
  unlockedManes: ManeThemeId[];
  unlockedHorns: HornStyleId[];
  unlockedWings: WingStyleId[];
  unlockedCrowns: CrownId[];
  unlockedAccessories: AccessoryId[];
  unlockedCompanions: CompanionId[];
  earnedMedals: RealmId[];
  equipped: PlayerCustomization;
  questProgress: Record<string, QuestProgressEntry>;
  dailyChallenge?: DailyChallengeProgress;
  memories: MemoryPhoto[];
  answeredQuestionIds: string[];
  powerUpgrades: PowerUpgrades;
  muted: boolean;
}

export interface HudSnapshot {
  realmId: RealmId;
  realmName: string;
  score: number;
  starsCollected: number;
  realmTokensCollected: number;
  gemsCollected: number;
  distance: number;
  hearts: number;
  maxHearts: number;
  combo: number;
  dashCharge: number; // 0..1
  highJumpCharge: number; // 0..1
  isDashing: boolean;
  magnetTimer: number;
  magnetMaxTimer: number;
  shieldActive: boolean;
  shieldCharges: number;
  starRushTimer: number;
  starRushMaxTimer: number;
  chestsOpened: number;
  portalsEntered: number;
  bossesDefeated: number;
  tricksPerformed: number;
  trickStreak: number;
  trickStreakTarget: number;
  secretZoneMode: 'none' | 'bonus' | 'challenge';
  secretZoneTimer: number;
  secretZoneMaxTimer: number;
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossShield: number;
  bossMaxShield: number;
  cloudsCleared: number;
  newHighScore: boolean;
  gameMode: GameMode;
  timeTrialRemaining: number;
  timeTrialMaxTime: number;
  timeTrialTargetDistance: number;
  timeTrialOutcome: 'none' | 'won' | 'timeout';
  timeTrialRewardStars: number;
}

export const REALM_DEFINITIONS: RealmDefinition[] = [
  {
    id: 'clouds',
    name: 'المملكة السحابية',
    subtitle: 'غيوم قطنية ومسلات بيضاء في الفجر',
    challengeNote: 'غيوم رعدية ورياح عالية',
    specialItemName: 'ريشة شمسية',
    bossName: 'ملك الغيوم الرعدية',
    skyTop: '#FCE4EC',
    skyMid: '#FFF0E6',
    skyBottom: '#FFF9F2',
    farLayerColor: '#F3C6D9',
    nearLayerColor: '#E7A9C4',
    platformMain: '#FFFFFF',
    platformShadow: '#F3D8E6',
    bouncyColor: '#FFF0F6',
    accentColor: '#E11D74',
    starOpacity: 0.25,
    timeTrialDistance: 230,
    timeTrialSeconds: 26,
  },
  {
    id: 'forest',
    name: 'الغابة المتلألئة',
    subtitle: 'أشجار كريستالية وفوانيس يراع مضيئة',
    challengeNote: 'فوانيس خفية وعقبات الغصون',
    specialItemName: 'فانوس يراع',
    bossName: 'بومة الظل العملاقة',
    skyTop: '#0F293A',
    skyMid: '#1C4B5C',
    skyBottom: '#2F7478',
    farLayerColor: '#163D4A',
    nearLayerColor: '#112E3A',
    platformMain: '#D8F3DC',
    platformShadow: '#52B788',
    bouncyColor: '#FFE5EC',
    accentColor: '#2DD4BF',
    starOpacity: 0.85,
    timeTrialDistance: 250,
    timeTrialSeconds: 28,
  },
  {
    id: 'meadow',
    name: 'حقل الأزهار السحري',
    subtitle: 'أزهار اللوتس المصرية وبتلات ذهبية',
    challengeNote: 'منصات اللوتس وفراشات الظل',
    specialItemName: 'زهرة لوتس',
    bossName: 'جعل الظل الطائر',
    skyTop: '#FDE6C4',
    skyMid: '#FCD5CE',
    skyBottom: '#FFF8EC',
    farLayerColor: '#E9B9B2',
    nearLayerColor: '#D69994',
    platformMain: '#FFFDF7',
    platformShadow: '#A7C957',
    bouncyColor: '#FFE8F0',
    accentColor: '#D97706',
    starOpacity: 0.3,
    timeTrialDistance: 260,
    timeTrialSeconds: 28,
  },
  {
    id: 'egypt',
    name: 'أرض الأهرامات والنيل',
    subtitle: 'أهرامات ذهبية وضفاف النيل الساحرة',
    challengeNote: 'زوابع الرمل وصقور الظل',
    specialItemName: 'زهرة البردي',
    bossName: 'أبو الهول الحارس',
    skyTop: '#FDE68A',
    skyMid: '#FDBA74',
    skyBottom: '#FFF7ED',
    farLayerColor: '#E9B472',
    nearLayerColor: '#D49451',
    platformMain: '#FEF3C7',
    platformShadow: '#D97706',
    bouncyColor: '#FDE68A',
    accentColor: '#0D9488',
    starOpacity: 0.35,
    timeTrialDistance: 275,
    timeTrialSeconds: 30,
  },
  {
    id: 'qatar',
    name: 'لؤلؤة الخليج والصحراء',
    subtitle: 'كثبان ذهبية ولآلئ الدوحة المضيئة',
    challengeNote: 'رياح الكثبان ونسور السماء',
    specialItemName: 'لؤلؤة الخليج',
    bossName: 'صقر الكثبان السحري',
    skyTop: '#6B1434',
    skyMid: '#B84A6A',
    skyBottom: '#FDE6C4',
    farLayerColor: '#C28B6B',
    nearLayerColor: '#9E6B55',
    platformMain: '#FFFBEB',
    platformShadow: '#9D174D',
    bouncyColor: '#FBCFE8',
    accentColor: '#F59E0B',
    starOpacity: 0.65,
    timeTrialDistance: 285,
    timeTrialSeconds: 30,
  },
  {
    id: 'turkey',
    name: 'سماء كابادوكيا السحرية',
    subtitle: 'مناطيد كابادوكيا ومآذن إسطنبول',
    challengeNote: 'غيوم البوسفور ومناطيد الظل',
    specialItemName: 'توليب إسطنبول',
    bossName: 'عنقاء البوسفور',
    skyTop: '#1E3A8A',
    skyMid: '#E11D48',
    skyBottom: '#FDE68A',
    farLayerColor: '#8B5E83',
    nearLayerColor: '#6D4568',
    platformMain: '#FFFDF9',
    platformShadow: '#0284C7',
    bouncyColor: '#FFE4E6',
    accentColor: '#E11D48',
    starOpacity: 0.55,
    timeTrialDistance: 300,
    timeTrialSeconds: 32,
  },
  {
    id: 'pharaohs',
    name: 'التراث المصري القديم',
    subtitle: 'أهرامات مصغرة ورمال ذهبية متلألئة وعناصر أثرية',
    challengeNote: 'أهرامات مصغرة وعواصف الرمل الذهبي',
    specialItemName: 'عنخ الحياة',
    bossName: 'حورس الذهبي الحارس',
    skyTop: '#F59E0B',
    skyMid: '#FDE68A',
    skyBottom: '#FFFBEB',
    farLayerColor: '#DF9B46',
    nearLayerColor: '#C47B2B',
    platformMain: '#FEF08A',
    platformShadow: '#B45309',
    bouncyColor: '#FDE047',
    accentColor: '#0D9488',
    starOpacity: 0.4,
    timeTrialDistance: 310,
    timeTrialSeconds: 33,
  },
];

export const UNICORN_TRAITS: UnicornTrait[] = [
  {
    id: 'luna',
    name: 'رشيقة الفجر',
    perkLabel: 'شحن أسرع لانطلاقة النور',
    glideGravityFactor: 0.34,
    magnetRadiusBonus: 0,
    dashCooldownFactor: 0.82,
    unlockCost: 0,
  },
  {
    id: 'sama',
    name: 'حارسة السحاب',
    perkLabel: 'تحليق أطول وأخف بالأجنحة',
    glideGravityFactor: 0.22,
    magnetRadiusBonus: 20,
    dashCooldownFactor: 1.0,
    unlockCost: 35,
  },
  {
    id: 'najma',
    name: 'نجمة النيل',
    perkLabel: 'تجذب النجوم من مسافة بعيدة',
    glideGravityFactor: 0.32,
    magnetRadiusBonus: 115,
    dashCooldownFactor: 0.95,
    unlockCost: 75,
  },
];

export const FUR_COLORS: FurColorOption[] = [
  {
    id: 'pearl',
    name: 'أبيض لؤلؤي',
    bodyColor: '#FFF9FC',
    bellyColor: '#FCE7F3',
    hoofColor: '#F472B6',
    eyeColor: '#4A1D6E',
    unlockCost: 0,
  },
  {
    id: 'blush',
    name: 'وردي ناعم',
    bodyColor: '#FFE4F0',
    bellyColor: '#FFF5F9',
    hoofColor: '#E11D74',
    eyeColor: '#581C87',
    unlockCost: 20,
  },
  {
    id: 'sky',
    name: 'سماوي ثلجي',
    bodyColor: '#EAF8FF',
    bellyColor: '#FFFFFF',
    hoofColor: '#0EA5E9',
    eyeColor: '#0F4C81',
    unlockCost: 30,
  },
  {
    id: 'honey',
    name: 'عسلي ذهبي',
    bodyColor: '#FFF5D6',
    bellyColor: '#FFFDF4',
    hoofColor: '#D97706',
    eyeColor: '#6B21A8',
    unlockCost: 40,
  },
  {
    id: 'lilac',
    name: 'ليلكي فاتح',
    bodyColor: '#F3E8FF',
    bellyColor: '#FAF5FF',
    hoofColor: '#9333EA',
    eyeColor: '#3B0764',
    unlockCost: 50,
  },
];

export const MANE_THEMES: ManeTheme[] = [
  {
    id: 'rose',
    name: 'وردي لؤلؤي',
    colors: ['#E11D74', '#F472B6', '#FB7185', '#FBCFE8'],
    unlockCost: 0,
  },
  {
    id: 'nile',
    name: 'فيروز النيل',
    colors: ['#0D9488', '#2DD4BF', '#38BDF8', '#A7F3D0'],
    unlockCost: 20,
  },
  {
    id: 'golden',
    name: 'شمس ذهبية',
    colors: ['#D97706', '#F59E0B', '#FBBF24', '#FDE68A'],
    unlockCost: 30,
  },
  {
    id: 'lavender',
    name: 'ليلكي هادئ',
    colors: ['#7E22CE', '#A855F7', '#C084FC', '#E9D5FF'],
    unlockCost: 40,
  },
  {
    id: 'lotus',
    name: 'زهر اللوتس',
    colors: ['#BE185D', '#FB7185', '#FDA4AF', '#FEF08A'],
    unlockCost: 55,
  },
];

export const HORN_STYLES: HornStyleOption[] = [
  {
    id: 'spiral-gold',
    name: 'ذهبي حلزوني',
    baseColor: '#F59E0B',
    tipColor: '#FFFBEB',
    accentColor: '#FFFFFF',
    unlockCost: 0,
  },
  {
    id: 'crystal-aqua',
    name: 'كريستال فيروزي',
    baseColor: '#0EA5E9',
    tipColor: '#E0F2FE',
    accentColor: '#7DD3FC',
    unlockCost: 25,
  },
  {
    id: 'pearl-rose',
    name: 'لؤلؤ وردي',
    baseColor: '#EC4899',
    tipColor: '#FFF1F2',
    accentColor: '#FDE68A',
    unlockCost: 35,
  },
  {
    id: 'star-glow',
    name: 'نجمي مضيء',
    baseColor: '#D97706',
    tipColor: '#FEF9C3',
    accentColor: '#F43F5E',
    unlockCost: 50,
  },
];

export const WING_STYLES: WingStyleOption[] = [
  {
    id: 'feathered',
    name: 'أجنحة ريشية',
    primaryColor: '#FBCFE8',
    secondaryColor: '#FFFFFF',
    unlockCost: 0,
  },
  {
    id: 'butterfly',
    name: 'أجنحة فراشة',
    primaryColor: '#FDE68A',
    secondaryColor: '#F472B6',
    unlockCost: 30,
  },
  {
    id: 'crystal',
    name: 'أجنحة بلورية',
    primaryColor: '#BAE6FD',
    secondaryColor: '#F0F9FF',
    unlockCost: 45,
  },
  {
    id: 'none',
    name: 'بدون أجنحة',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    unlockCost: 0,
  },
];

export const CROWN_ITEMS: CrownItem[] = [
  { id: 'none', name: 'بدون تاج', unlockCost: 0 },
  { id: 'flower', name: 'طوق اللوتس', unlockCost: 20 },
  { id: 'star', name: 'تاج النجوم', unlockCost: 40 },
  { id: 'crystal', name: 'تاج الكريستال', unlockCost: 65 },
];

export const COMPANION_OPTIONS: CompanionOption[] = [
  {
    id: 'bird',
    name: 'العصفور توت',
    subtitle: 'يلتقط النجوم القريبة بسرعة',
    primaryColor: '#FBBF24',
    accentColor: '#E11D74',
    unlockCost: 0,
  },
  {
    id: 'butterfly',
    name: 'الفراشة زهرة',
    subtitle: 'ترفرف بجانب اليونيكورن وتجمع النجوم',
    primaryColor: '#F472B6',
    accentColor: '#2DD4BF',
    unlockCost: 30,
  },
  {
    id: 'none',
    name: 'بدون مرافق',
    subtitle: 'تحليق منفرد في السماء',
    primaryColor: '#E5E7EB',
    accentColor: '#9CA3AF',
    unlockCost: 0,
  },
];

export const GIFT_ACCESSORIES: GiftAccessory[] = [
  {
    id: 'none',
    name: 'بدون إكسسوار إضافي',
    description: 'مظهر بسيط وأنيق لليونيكورن',
    primaryColor: '#E5E7EB',
    accentColor: '#9CA3AF',
    unlockCost: 0,
  },
  {
    id: 'pearl-necklace',
    name: 'عقد اللؤلؤ الذهبي',
    description: 'لآلئ بيضاء ناعمة مع تعليقة قلب ذهبية حول العنق',
    primaryColor: '#FFFBEB',
    accentColor: '#F59E0B',
    unlockCost: 25,
  },
  {
    id: 'rose-ribbon',
    name: 'وشاح الحرير الوردي',
    description: 'فيونكة وشاح وردي تتطاير بخفة مع النسيم',
    primaryColor: '#E11D74',
    accentColor: '#FBCFE8',
    unlockCost: 35,
  },
  {
    id: 'nile-collar',
    name: 'قلادة العنخ الفرعونية',
    description: 'طوق ذهبي وفيروزي مستوحى من التراث المصري الأصيل',
    primaryColor: '#0D9488',
    accentColor: '#FBBF24',
    unlockCost: 50,
  },
  {
    id: 'star-anklet',
    name: 'حليّ النجوم المتلألئة',
    description: 'شريط سرج مزخرف بالنجوم وحلية نجمية مضيئة',
    primaryColor: '#FBBF24',
    accentColor: '#FEF08A',
    unlockCost: 60,
  },
  {
    id: 'lotus-brooch',
    name: 'بروش اللوتس الملكي',
    description: 'زهرة لوتس مرصعة بالأحجار الفيروزية والوردي الملكي',
    primaryColor: '#BE185D',
    accentColor: '#2DD4BF',
    unlockCost: 75,
  },
];

export const BOSS_MEDALS: BossMedal[] = [
  {
    realmId: 'clouds',
    title: 'وسام حارسة الغيوم',
    bossName: 'ملك الغيوم الرعدية',
    realmName: 'المملكة السحابية',
    description: 'تُمنح عند هزيمة ملك الغيوم الرعدية في المملكة السحابية',
    primaryColor: '#F472B6',
    ribbonColor: '#E11D74',
  },
  {
    realmId: 'forest',
    title: 'وسام نور الغابة',
    bossName: 'بومة الظل العملاقة',
    realmName: 'الغابة المتلألئة',
    description: 'تُمنح عند هزيمة بومة الظل العملاقة في الغابة المتلألئة',
    primaryColor: '#2DD4BF',
    ribbonColor: '#0D9488',
  },
  {
    realmId: 'meadow',
    title: 'ميدالية زهرة اللوتس',
    bossName: 'جعل الظل الطائر',
    realmName: 'حقل الأزهار السحري',
    description: 'تُمنح عند هزيمة جعل الظل الطائر في حقل الأزهار السحري',
    primaryColor: '#FBBF24',
    ribbonColor: '#D97706',
  },
  {
    realmId: 'egypt',
    title: 'ميدالية النيل الذهبية',
    bossName: 'أبو الهول الحارس',
    realmName: 'أرض الأهرامات والنيل',
    description: 'تُمنح عند التغلب على أبو الهول الحارس في أرض الأهرامات والنيل',
    primaryColor: '#F59E0B',
    ribbonColor: '#0D9488',
  },
  {
    realmId: 'qatar',
    title: 'ميدالية لؤلؤة الكثبان',
    bossName: 'صقر الكثبان السحري',
    realmName: 'لؤلؤة الخليج والصحراء',
    description: 'تُمنح عند هزيمة صقر الكثبان السحري في لؤلؤة الخليج والصحراء',
    primaryColor: '#FB7185',
    ribbonColor: '#9D174D',
  },
  {
    realmId: 'turkey',
    title: 'وسام عنقاء كابادوكيا',
    bossName: 'عنقاء البوسفور',
    realmName: 'سماء كابادوكيا السحرية',
    description: 'تُمنح عند هزيمة عنقاء البوسفور في سماء كابادوكيا السحرية',
    primaryColor: '#38BDF8',
    ribbonColor: '#E11D48',
  },
  {
    realmId: 'pharaohs',
    title: 'وسام حورس الذهبي',
    bossName: 'حورس الذهبي الحارس',
    realmName: 'التراث المصري القديم',
    description: 'تُمنح عند هزيمة حورس الذهبي الحارس في عالم التراث المصري القديم',
    primaryColor: '#FDE047',
    ribbonColor: '#B45309',
  },
];

export const DEFAULT_POWER_UPGRADES: PowerUpgrades = {
  shield: 1,
  speed: 1,
  magnet: 1,
};

export const POWER_UPGRADE_DEFINITIONS: PowerUpgradeDefinition[] = [
  {
    id: 'shield',
    name: 'الدرع السحري',
    description: 'يحمي اليونيكورن من العوائق ويمدد فترة الأمان بعد امتصاص الضربة.',
    primaryColor: '#E11D74',
    accentColor: '#FBCFE8',
    tiers: [
      { level: 1, cost: 0, effectLabel: 'شحنة حماية واحدة · أمان 1.6 ث عند الانكسار' },
      { level: 2, cost: 15, effectLabel: 'شحنة حماية + أمان 2.1 ث + مكافأة +25 نقطة عند الصد' },
      { level: 3, cost: 30, effectLabel: 'درع مزدوج (شحنتان) عند التقاط الدرع · أمان 2.2 ث' },
      { level: 4, cost: 50, effectLabel: 'شحنتان + بداية كل رحلة بدرع سحري مفعّل تلقائياً' },
      { level: 5, cost: 75, effectLabel: '3 شحنات حماية + بداية بدرع مفعّل + أمان 2.6 ث' },
    ],
  },
  {
    id: 'speed',
    name: 'السرعة الخارقة',
    description: 'يطيل مدة الاندفاع والسرعة الخارقة ويسرّع إعادة شحن الانطلاقة.',
    primaryColor: '#D97706',
    accentColor: '#FEF3C7',
    tiers: [
      { level: 1, cost: 0, effectLabel: 'مدة 6.0 ث · اندفاع 0.48 ث · شحن كل 3.5 ث' },
      { level: 2, cost: 15, effectLabel: 'مدة 7.5 ث · اندفاع 0.56 ث · شحن كل 3.1 ث' },
      { level: 3, cost: 30, effectLabel: 'مدة 9.0 ث · اندفاع 0.64 ث · شحن كل 2.7 ث' },
      { level: 4, cost: 50, effectLabel: 'مدة 10.5 ث · اندفاع 0.72 ث · شحن كل 2.3 ث' },
      { level: 5, cost: 75, effectLabel: 'مدة 12.0 ث · اندفاع 0.82 ث · شحن كل 1.9 ث وسرعة فائقة' },
    ],
  },
  {
    id: 'magnet',
    name: 'مغناطيس النجوم',
    description: 'يوسع دائرة جذب النجوم والجواهر وتطيل مدته خلال التحليق.',
    primaryColor: '#0284C7',
    accentColor: '#E0F2FE',
    tiers: [
      { level: 1, cost: 0, effectLabel: 'مدة 6.5 ث · مدى جذب 220 بكسل' },
      { level: 2, cost: 15, effectLabel: 'مدة 8.0 ث · مدى جذب 265 بكسل' },
      { level: 3, cost: 30, effectLabel: 'مدة 9.5 ث · مدى جذب 315 بكسل وسرعة سحب أعلى' },
      { level: 4, cost: 50, effectLabel: 'مدة 11.5 ث · مدى جذب 370 بكسل + 25 بكسل تلقائي' },
      { level: 5, cost: 75, effectLabel: 'مدة 14.0 ث · مدى جذب 430 بكسل + 50 بكسل تلقائي' },
    ],
  },
];

export function clampPowerLevel(level: number | undefined): number {
  if (typeof level !== 'number' || Number.isNaN(level)) return 1;
  return Math.max(1, Math.min(5, Math.floor(level)));
}

export function getShieldUpgradeStats(level: number) {
  const lv = clampPowerLevel(level);
  const maxCharges = lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
  const invulnDuration = [1.6, 2.1, 2.2, 2.4, 2.6][lv - 1];
  const blockBonusScore = lv >= 2 ? 25 * (lv - 1) : 0;
  const startWithShield = lv >= 4;
  return { level: lv, maxCharges, invulnDuration, blockBonusScore, startWithShield };
}

export function getSpeedUpgradeStats(level: number) {
  const lv = clampPowerLevel(level);
  const starRushDuration = [6.0, 7.5, 9.0, 10.5, 12.0][lv - 1];
  const dashDuration = [0.48, 0.56, 0.64, 0.72, 0.82][lv - 1];
  const dashCooldown = [3.5, 3.1, 2.7, 2.3, 1.9][lv - 1];
  const speedMultiplierBonus = [0, 0.05, 0.1, 0.15, 0.22][lv - 1];
  return { level: lv, starRushDuration, dashDuration, dashCooldown, speedMultiplierBonus };
}

export function getMagnetUpgradeStats(level: number) {
  const lv = clampPowerLevel(level);
  const duration = [6.5, 8.0, 9.5, 11.5, 14.0][lv - 1];
  const activeRadius = [220, 265, 315, 370, 430][lv - 1];
  const passiveBonusRadius = [0, 0, 12, 25, 50][lv - 1];
  const pullSpeed = [560, 620, 690, 760, 840][lv - 1];
  return { level: lv, duration, activeRadius, passiveBonusRadius, pullSpeed };
}

export function getPowerUpgradeNextTier(id: PowerUpgradeId, currentLevel: number): PowerUpgradeTier | null {
  const def = POWER_UPGRADE_DEFINITIONS.find((p) => p.id === id);
  if (!def) return null;
  const lv = clampPowerLevel(currentLevel);
  return def.tiers.find((t) => t.level === lv + 1) || null;
}

