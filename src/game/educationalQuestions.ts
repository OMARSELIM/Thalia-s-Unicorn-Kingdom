import { RealmId } from './types';

export type QuestionCategory = 'math' | 'heritage' | 'science' | 'arabic';

export interface EducationalQuestion {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  realmId?: RealmId;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  rewardStars: number;
}

export const QUESTION_CATEGORIES: { id: 'all' | QuestionCategory; label: string }[] = [
  { id: 'all', label: 'جميع المواد' },
  { id: 'math', label: 'الحساب والرياضيات' },
  { id: 'heritage', label: 'التراث والجغرافيا' },
  { id: 'science', label: 'العلوم والطبيعة' },
  { id: 'arabic', label: 'اللغة العربية' },
];

export const EDUCATIONAL_QUESTIONS: EducationalQuestion[] = [
  // Math (5)
  {
    id: 'math_1',
    category: 'math',
    categoryLabel: 'الحساب والرياضيات',
    question: 'إذا جمعتِ 8 نجوم من الغيوم ثم أضاف لكِ العصفور 7 نجوم أخرى، فكم نجمة معكِ الآن؟',
    options: ['14 نجمة', '15 نجمة', '16 نجمة', '13 نجمة'],
    correctIndex: 1,
    explanation: 'ممتازة! حاصل جمع 8 + 7 يساوي 15 نجمة.',
    rewardStars: 15,
  },
  {
    id: 'math_2',
    category: 'math',
    categoryLabel: 'الحساب والرياضيات',
    question: 'كم ضلعاً يملك شكل الهرم المثلثي من الواجهة الأمامية (المثلث)؟',
    options: ['ضلعان', '3 أضلاع', '4 أضلاع', '5 أضلاع'],
    correctIndex: 1,
    explanation: 'رائعة! المثلث يتكون دائماً من 3 أضلاع و3 زوايا.',
    rewardStars: 15,
  },
  {
    id: 'math_3',
    category: 'math',
    categoryLabel: 'الحساب والرياضيات',
    question: 'كان معكِ 24 نجمة وصرفتِ منها 9 نجوم في متجر الهدايا، كم نجمة تبقّت معكِ؟',
    options: ['15 نجمة', '14 نجمة', '16 نجمة', '17 نجمة'],
    correctIndex: 0,
    explanation: 'صحيح! عند طرح 24 - 9 يتبقى 15 نجمة.',
    rewardStars: 15,
  },
  {
    id: 'math_4',
    category: 'math',
    categoryLabel: 'الحساب والرياضيات',
    question: 'إذا كان لكل طائر سحري جناحان، فكم جناحاً لـ 4 طيور معاً؟',
    options: ['6 أجنحة', '8 أجنحة', '10 أجنحة', '4 أجنحة'],
    correctIndex: 1,
    explanation: 'أحسنتِ! 4 × 2 = 8 أجنحة.',
    rewardStars: 15,
  },
  {
    id: 'math_5',
    category: 'math',
    categoryLabel: 'الحساب والرياضيات',
    question: 'ما هو نصف العدد 20؟',
    options: ['5', '8', '10', '12'],
    correctIndex: 2,
    explanation: 'رائعة! نصف العدد 20 هو 10 لأن 10 + 10 = 20.',
    rewardStars: 15,
  },

  // Heritage & Geography (5)
  {
    id: 'heritage_1',
    category: 'heritage',
    categoryLabel: 'التراث والجغرافيا',
    realmId: 'egypt',
    question: 'ما اسم النهر العظيم الذي يمر عبر مصر وتنمو على ضفافه زهور البردي؟',
    options: ['نهر دجلة', 'نهر النيل', 'نهر الفرات', 'نهر الأمازون'],
    correctIndex: 1,
    explanation: 'نهر النيل هو شريان الحياة في مصر ومن أطول أنهار العالم!',
    rewardStars: 20,
  },
  {
    id: 'heritage_2',
    category: 'heritage',
    categoryLabel: 'التراث والجغرافيا',
    realmId: 'pharaohs',
    question: 'إلى ماذا يرمز مفتاح «عنخ» في الحضارة المصرية القديمة؟',
    options: ['الحياة', 'السحاب', 'المطر', 'القمر'],
    correctIndex: 0,
    explanation: 'ممتازة! كان المصريون القدماء يرمزون بمفتاح «عنخ» إلى الحياة الأبدية.',
    rewardStars: 20,
  },
  {
    id: 'heritage_3',
    category: 'heritage',
    categoryLabel: 'التراث والجغرافيا',
    realmId: 'qatar',
    question: 'ما عاصمة دولة قطر المعروفة بكورنيشها الجميل وتراثها البحري واللؤلؤي؟',
    options: ['مسقط', 'الدوحة', 'المنامة', 'دبي'],
    correctIndex: 1,
    explanation: 'أحسنتِ! الدوحة هي عاصمة دولة قطر وتشتهر بتراثها في الغوص على اللؤلؤ.',
    rewardStars: 20,
  },
  {
    id: 'heritage_4',
    category: 'heritage',
    categoryLabel: 'التراث والجغرافيا',
    realmId: 'turkey',
    question: 'ما اسم المنطقة التركية الشهيرة بتحليق المناطيد الملونة في سمائها وقت الفجر؟',
    options: ['كابادوكيا', 'أنطاليا', 'طرابزون', 'أزمير'],
    correctIndex: 0,
    explanation: 'رائعة! كابادوكيا من أشهر مناطق العالم في رحلات المناطيد الهوائية الساحرة.',
    rewardStars: 20,
  },
  {
    id: 'heritage_5',
    category: 'heritage',
    categoryLabel: 'التراث والجغرافيا',
    realmId: 'pharaohs',
    question: 'أين تقع أهرامات الجيزة الثلاثة الشهيرة وأبو الهول؟',
    options: ['في الأردن', 'في مصر', 'في المغرب', 'في تونس'],
    correctIndex: 1,
    explanation: 'صحيح! تقع أهرامات الجيزة وأبو الهول في مصر وهي من عجائب الدنيا القديمة.',
    rewardStars: 20,
  },

  // Science & Nature (5)
  {
    id: 'science_1',
    category: 'science',
    categoryLabel: 'العلوم والطبيعة',
    question: 'كم عدد كواكب المجموعة الشمسية التي تدور حول الشمس؟',
    options: ['6 كواكب', '7 كواكب', '8 كواكب', '10 كواكب'],
    correctIndex: 2,
    explanation: 'ممتازة! تدور 8 كواكب حول الشمس، ومنها كوكب الأرض.',
    rewardStars: 15,
  },
  {
    id: 'science_2',
    category: 'science',
    categoryLabel: 'العلوم والطبيعة',
    question: 'أي جزء من أجزاء النبات يمتص الماء والأملاح من التربة؟',
    options: ['الأوراق', 'الجذور', 'الأزهار', 'الثمار'],
    correctIndex: 1,
    explanation: 'رائعة! الجذور تثبّت النبات في الأرض وتمتص له الماء والغذاء من التربة.',
    rewardStars: 15,
  },
  {
    id: 'science_3',
    category: 'science',
    categoryLabel: 'العلوم والطبيعة',
    question: 'ما المصدر الرئيسي للضوء والدفء على كوكب الأرض؟',
    options: ['القمر', 'الشمس', 'الرياح', 'الغيوم'],
    correctIndex: 1,
    explanation: 'صحيح! الشمس نجم مضيء يمنح الأرض الضوء والدفء اللازمين للحياة.',
    rewardStars: 15,
  },
  {
    id: 'science_4',
    category: 'science',
    categoryLabel: 'العلوم والطبيعة',
    question: 'أي كوكب يُعرف باسم «الكوكب الأحمر»؟',
    options: ['الزهرة', 'المريخ', 'المشتري', 'عطارد'],
    correctIndex: 1,
    explanation: 'أحسنتِ! يُسمى المريخ بالكوكب الأحمر بسبب لون تربته الغنية بأكسيد الحديد.',
    rewardStars: 15,
  },
  {
    id: 'science_5',
    category: 'science',
    categoryLabel: 'العلوم والطبيعة',
    question: 'تتحول اليرقة الصغيرة بعد فترة داخل الشرنقة إلى أي كائن جميل؟',
    options: ['سمكة', 'فراشة', 'سحلية', 'نحلة'],
    correctIndex: 1,
    explanation: 'رائعة! تخرج الفراشة الملونة من الشرنقة في واحدة من أجمل مراحل الطبيعة.',
    rewardStars: 15,
  },

  // Arabic Language (5)
  {
    id: 'arabic_1',
    category: 'arabic',
    categoryLabel: 'اللغة العربية',
    question: 'ما مفرد كلمة «نُجُوم»؟',
    options: ['نَجْمَة / نَجْم', 'نُجَيمات', 'أَنْجُم', 'سَمَاء'],
    correctIndex: 0,
    explanation: 'ممتازة! مفرد كلمة «نجوم» هو «نجم» أو «نجمة».',
    rewardStars: 15,
  },
  {
    id: 'arabic_2',
    category: 'arabic',
    categoryLabel: 'اللغة العربية',
    question: 'ما ضد (عكس) كلمة «سَرِيع»؟',
    options: ['خَفِيف', 'بَطِيء', 'قَوِيّ', 'طَوِيل'],
    correctIndex: 1,
    explanation: 'أحسنتِ! عكس كلمة «سريع» هو «بطيء».',
    rewardStars: 15,
  },
  {
    id: 'arabic_3',
    category: 'arabic',
    categoryLabel: 'اللغة العربية',
    question: 'ما جمع كلمة «زَهْرَة»؟',
    options: ['زُهُور / أَزْهَار', 'زَهْرَتَان', 'مَزْهَرِيَّة', 'زَاهِر'],
    correctIndex: 0,
    explanation: 'رائعة! جمع كلمة «زهرة» هو «زهور» أو «أزهار».',
    rewardStars: 15,
  },
  {
    id: 'arabic_4',
    category: 'arabic',
    categoryLabel: 'اللغة العربية',
    question: 'كم يوماً في الأسبوع الواحد؟',
    options: ['5 أيام', '6 أيام', '7 أيام', '8 أيام'],
    correctIndex: 2,
    explanation: 'صحيح! يتكون الأسبوع من 7 أيام تبدأ بالسبت أو الأحد وتنتهي بالجمعة.',
    rewardStars: 15,
  },
  {
    id: 'arabic_5',
    category: 'arabic',
    categoryLabel: 'اللغة العربية',
    question: 'أيّ من الكلمات التالية تُعدّ فعلاً يدلّ على الحركة؟',
    options: ['السَّحَابَة', 'يَقْفِزُ', 'اللُّؤْلُؤَة', 'القَمَر'],
    correctIndex: 1,
    explanation: 'أحسنتِ! كلمة «يَقْفِزُ» فعل مضارع يدل على الحركة، أما الباقي فأسماء.',
    rewardStars: 15,
  },
];
