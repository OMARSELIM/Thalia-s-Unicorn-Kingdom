import { RealmId } from './types';

export type QuestMetric = 'stars' | 'realmTokens' | 'gems' | 'cloudsCleared' | 'distance';

export type PuzzleType = 'sequence' | 'colorMatch' | 'symbolOrder';

export interface QuestDefinition {
  id: string;
  realmId: RealmId;
  title: string;
  characterName: string;
  characterRole: string;
  storyText: string;
  metric: QuestMetric;
  targetCount: number;
  rewardStars: number;
  puzzleType?: PuzzleType;
  puzzlePrompt?: string;
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'q1_basbousa_stars',
    realmId: 'clouds',
    title: 'تاج القطة بسبوسة',
    characterName: 'القطة بسبوسة',
    characterRole: 'صديقة الغيوم اللطيفة',
    storyText:
      'أهلاً يا تاليا! القطة بسبوسة ضاع منها 8 نجوم ذهبية بين الغيوم. اجمعيهم لها عشان تكمّل تاجها السماوي!',
    metric: 'stars',
    targetCount: 8,
    rewardStars: 30,
  },
  {
    id: 'q2_nesma_lanterns',
    realmId: 'forest',
    title: 'لغز فوانيس الغابة',
    characterName: 'البومة نسمة',
    characterRole: 'حارسة الغابة المتلألئة',
    storyText:
      'يا تاليا، البومة نسمة محتاجة 3 فوانيس يراع من الغابة المتلألئة وبعدها تساعديها في ترتيب رموز بوابة الشجرة!',
    metric: 'realmTokens',
    targetCount: 3,
    rewardStars: 40,
    puzzleType: 'sequence',
    puzzlePrompt: 'رتّبي رموز النور بالترتيب الصحيح لفتح بوابة الشجرة: القمر ← النجمة ← اللوتس',
  },
  {
    id: 'q3_zahra_lotus',
    realmId: 'meadow',
    title: 'حديقة الفراشة زهرة',
    characterName: 'الفراشة زهرة',
    characterRole: 'راعِيَة حقل الأزهار',
    storyText:
      'الفراشة زهرة بتجهّز حقل الأزهار السحري! اجمعي 4 أزهار لوتس من الحقل ووصّلي كل فراشة بلون زهرتها المفضلة.',
    metric: 'realmTokens',
    targetCount: 4,
    rewardStars: 45,
    puzzleType: 'colorMatch',
    puzzlePrompt: 'اختاري اللون المطابق لكل زهرة عشان الفراشات ترقص في الحقل!',
  },
  {
    id: 'q4_toot_storm',
    realmId: 'clouds',
    title: 'تهدئة غيوم العاصفة',
    characterName: 'العصفور توت',
    characterRole: 'مغني الفجر السعيد',
    storyText:
      'العصفور توت خايف من الغيوم الرعدية في المملكة السحابية! استخدمي اندفاعة النور لتشتيت 2 سحابة رعدية.',
    metric: 'cloudsCleared',
    targetCount: 2,
    rewardStars: 40,
  },
  {
    id: 'q5_reem_amulet',
    realmId: 'forest',
    title: 'أحجية التميمة النيلية',
    characterName: 'الغزالة ريم',
    characterRole: 'مكتشفة الجواهر',
    storyText:
      'الغزالة ريم لقت تميمة قديمة في الغابة المتلألئة! اجمعي 2 جوهرة كريستال وحلّي لغز إكمال النمط السحري.',
    metric: 'gems',
    targetCount: 2,
    rewardStars: 50,
    puzzleType: 'symbolOrder',
    puzzlePrompt: 'اكتشفي الرمز الناقص لإكمال نمط التميمة: ★  ◆  ★  ◆  ★  [ ؟ ]',
  },
  {
    id: 'q6_talia_festival',
    realmId: 'meadow',
    title: 'مهرجان تاليا الكبير',
    characterName: 'كل أصدقاء المملكة',
    characterRole: 'احتفال حقل الأزهار',
    storyText:
      'أنتِ بطلة المملكة يا تاليا عمر! اقطعي 220 متر في حقل الأزهار السحري لتبدئي المهرجان الكبير.',
    metric: 'distance',
    targetCount: 220,
    rewardStars: 60,
  },
  {
    id: 'q7_egypt_papyrus',
    realmId: 'egypt',
    title: 'بردية النيل الذهبية',
    characterName: 'الحكيم حابي',
    characterRole: 'حارس ضفاف النيل',
    storyText:
      'أهلاً في أرض الأهرامات يا تاليا! اجمعي 3 زهور بردي من جوار الأهرامات الذهبية لنضيء معبد النيل.',
    metric: 'realmTokens',
    targetCount: 3,
    rewardStars: 55,
  },
  {
    id: 'q8_qatar_pearls',
    realmId: 'qatar',
    title: 'عقد لآلئ الدوحة',
    characterName: 'الغواص سالم',
    characterRole: 'باحث لآلئ الخليج',
    storyText:
      'في لؤلؤة الخليج والصحراء تنتظرك أصداف مضيئة! اجمعي 4 لآلئ الخليج لتزيين مركب الدوحة الشراعي.',
    metric: 'realmTokens',
    targetCount: 4,
    rewardStars: 60,
  },
  {
    id: 'q9_turkey_tulips',
    realmId: 'turkey',
    title: 'مهرجان مناطيد كابادوكيا',
    characterName: 'الطيارة ليلى',
    characterRole: 'قائدة المناطيد السحرية',
    storyText:
      'حلّقي بين المناطيد فوق كابادوكيا وإسطنبول واجمعي 4 توليب إسطنبول لبدء التحليق المسائي!',
    metric: 'realmTokens',
    targetCount: 4,
    rewardStars: 65,
  },
  {
    id: 'q10_pharaohs_ankh',
    realmId: 'pharaohs',
    title: 'أسرار التراث المصري القديم',
    characterName: 'الأميرة نفرتاري',
    characterRole: 'حارسة المعابد الذهبية',
    storyText:
      'تألقي وسط الرمال الذهبية يا تاليا! اقفزي فوق الأهرامات المصغرة واجمعي 4 من عنخ الحياة السحري.',
    metric: 'realmTokens',
    targetCount: 4,
    rewardStars: 70,
  },
];

export interface DailyChallengeDefinition {
  id: string;
  realmId: RealmId;
  title: string;
  description: string;
  metric: 'stars' | 'distance';
  targetCount: number;
  rewardStars: number;
}

export const DAILY_CHALLENGE_POOL: DailyChallengeDefinition[] = [
  {
    id: 'dc_clouds_stars',
    realmId: 'clouds',
    title: 'حصاد نجوم السحاب',
    description: 'اجمعي 25 نجمة في المملكة السحابية خلال اليوم',
    metric: 'stars',
    targetCount: 25,
    rewardStars: 75,
  },
  {
    id: 'dc_egypt_stars',
    realmId: 'egypt',
    title: 'كنوز نجوم الأهرامات',
    description: 'اجمعي 28 نجمة في أرض الأهرامات والنيل خلال اليوم',
    metric: 'stars',
    targetCount: 28,
    rewardStars: 85,
  },
  {
    id: 'dc_qatar_distance',
    realmId: 'qatar',
    title: 'سباق كثبان الخليج',
    description: 'صِلي إلى مسافة 270 متر في لؤلؤة الخليج والصحراء',
    metric: 'distance',
    targetCount: 270,
    rewardStars: 90,
  },
  {
    id: 'dc_turkey_stars',
    realmId: 'turkey',
    title: 'نجوم مناطيد كابادوكيا',
    description: 'اجمعي 32 نجمة في سماء كابادوكيا السحرية خلال اليوم',
    metric: 'stars',
    targetCount: 32,
    rewardStars: 95,
  },
  {
    id: 'dc_pharaohs_stars',
    realmId: 'pharaohs',
    title: 'كنوز الرمال الذهبية',
    description: 'اجمعي 30 نجمة في عالم التراث المصري القديم خلال اليوم',
    metric: 'stars',
    targetCount: 30,
    rewardStars: 95,
  },
  {
    id: 'dc_forest_distance',
    realmId: 'forest',
    title: 'رحلة الغابة المتلألئة',
    description: 'صِلي إلى مسافة 260 متر في الغابة المتلألئة',
    metric: 'distance',
    targetCount: 260,
    rewardStars: 85,
  },
  {
    id: 'dc_meadow_stars',
    realmId: 'meadow',
    title: 'نجوم حقل الأزهار',
    description: 'اجمعي 30 نجمة في حقل الأزهار السحري خلال اليوم',
    metric: 'stars',
    targetCount: 30,
    rewardStars: 90,
  },
  {
    id: 'dc_clouds_distance',
    realmId: 'clouds',
    title: 'تحليق القمم السحابية',
    description: 'صِلي إلى مسافة 280 متر في المملكة السحابية',
    metric: 'distance',
    targetCount: 280,
    rewardStars: 85,
  },
  {
    id: 'dc_forest_stars',
    realmId: 'forest',
    title: 'توهج نجوم اليراع',
    description: 'اجمعي 35 نجمة في الغابة المتلألئة خلال اليوم',
    metric: 'stars',
    targetCount: 35,
    rewardStars: 95,
  },
  {
    id: 'dc_meadow_distance',
    realmId: 'meadow',
    title: 'ماراثون أزهار اللوتس',
    description: 'صِلي إلى مسافة 300 متر في حقل الأزهار السحري',
    metric: 'distance',
    targetCount: 300,
    rewardStars: 100,
  },
];

export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyChallengeForDate(dateKey: string): DailyChallengeDefinition {
  let sum = 0;
  for (let i = 0; i < dateKey.length; i++) {
    sum = (sum * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return DAILY_CHALLENGE_POOL[sum % DAILY_CHALLENGE_POOL.length];
}

