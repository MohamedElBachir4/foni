export type SeoKeywordPageConfig = {
  slug: "afficheur" | "batterie" | "iphone" | "samsung";
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  intro: string;
  faq: Array<{ question: string; answer: string }>;
};

export const seoKeywordPages: Record<string, SeoKeywordPageConfig> = {
  afficheur: {
    slug: "afficheur",
    title: "Afficheur iPhone Samsung في الجزائر",
    description:
      "شراء afficheur أصلي ومجرب لهواتف iPhone وSamsung في الجزائر من متجر Foni مع قطع غيار موثوقة وخدمة سريعة.",
    keywords: [
      "afficheur",
      "afficheur iphone",
      "afficheur samsung",
      "شاشة هاتف",
      "قطع غيار هواتف الجزائر",
    ],
    h1: "Afficheur هواتف iPhone وSamsung في الجزائر",
    intro:
      "إذا تبحث عن afficheur أصلي أو عالي الجودة لهاتفك، متجر Foni يوفر لك خيارات متعددة حسب الموديل مع أسعار واضحة وتوفر مستمر.",
    faq: [
      {
        question: "هل afficheur في متجر Foni متوفر لموديلات مختلفة؟",
        answer:
          "نعم، تتوفر شاشات afficheur لعدد كبير من موديلات iPhone وSamsung وغيرها مع تحديث دائم للمخزون.",
      },
      {
        question: "كيف أختار afficheur المناسب لهاتفي؟",
        answer:
          "يمكنك الدخول لقسم قطع الغيار ثم اختيار الماركة والموديل الصحيح، أو التواصل معنا مباشرة لتأكيد التوافق قبل الشراء.",
      },
    ],
  },
  batterie: {
    slug: "batterie",
    title: "Batterie iPhone Samsung أصلية في الجزائر",
    description:
      "متجر Foni يوفر batterie لهواتف iPhone وSamsung بجودة ممتازة مع معلومات واضحة حول التوافق والسعر داخل الجزائر.",
    keywords: [
      "batterie",
      "batterie iphone",
      "batterie samsung",
      "بطارية ايفون",
      "بطارية سامسونغ",
    ],
    h1: "Batterie و بطاريات الهواتف في الجزائر",
    intro:
      "عند ضعف بطارية الهاتف، يمكنك إيجاد batterie مناسبة في متجر Foni بسرعة عبر الماركة والموديل، مع صور المنتج وتفاصيله.",
    faq: [
      {
        question: "هل batterie أصلية أم تجارية؟",
        answer:
          "نحن نوفر خيارات متعددة حسب التوفر والجودة، وتفاصيل كل منتج تظهر بوضوح داخل صفحة القطعة قبل الطلب.",
      },
      {
        question: "هل البطارية مناسبة لهاتفي؟",
        answer:
          "نعم، كل بطارية مرتبطة بالموديلات المتوافقة. اختر موديل الهاتف الصحيح وستظهر القطع المناسبة فقط.",
      },
    ],
  },
  iphone: {
    slug: "iphone",
    title: "قطع غيار iPhone في الجزائر | Foni",
    description:
      "أفضل صفحة لشراء قطع غيار iPhone في الجزائر: afficheur، batterie، connectors وغيرها مع بحث سريع حسب موديل iPhone.",
    keywords: [
      "iphone",
      "قطع غيار iphone",
      "afficheur iphone",
      "batterie iphone",
      "صيانة ايفون الجزائر",
    ],
    h1: "قطع غيار iPhone الأصلية وشبه الأصلية",
    intro:
      "في Foni تجد قطع iPhone الأساسية مثل afficheur وbatterie وغيرها، مع سهولة الوصول حسب موديل الهاتف داخل الجزائر.",
    faq: [
      {
        question: "هل تتوفر قطع غيار iPhone لكل الموديلات؟",
        answer:
          "نغطي معظم موديلات iPhone الشائعة، ويتم تحديث المنتجات المتاحة باستمرار حسب المخزون.",
      },
      {
        question: "كيف أطلب قطع iPhone بسرعة؟",
        answer:
          "ابحث باسم القطعة أو موديل iPhone من شريط البحث، ثم أكمل الطلب مباشرة من صفحة المنتج.",
      },
    ],
  },
  samsung: {
    slug: "samsung",
    title: "قطع غيار Samsung في الجزائر | Foni",
    description:
      "تصفح قطع غيار Samsung في الجزائر لدى Foni: afficheur، batterie وقطع أخرى لموديلات Galaxy المختلفة مع أسعار محدثة.",
    keywords: [
      "samsung",
      "قطع غيار samsung",
      "afficheur samsung",
      "batterie samsung",
      "سامسونغ",
      "samasung",
    ],
    h1: "قطع غيار Samsung لموديلات Galaxy",
    intro:
      "نوفر في Foni مجموعة قطع غيار Samsung للموديلات الأكثر طلبا، مع تصفح سهل حسب النوع والموديل.",
    faq: [
      {
        question: "هل تتوفر قطع Samsung لجميع سلاسل Galaxy؟",
        answer:
          "المتوفر يعتمد على المخزون، لكننا نضيف قطع Galaxy الأكثر طلبا بشكل مستمر داخل المتجر.",
      },
      {
        question: "هل يمكن الطلب إلى مختلف ولايات الجزائر؟",
        answer:
          "نعم، يدعم المتجر الطلب والتوصيل داخل الجزائر مع خطوات شراء واضحة وسهلة.",
      },
    ],
  },
};

