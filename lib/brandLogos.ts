/**
 * شعارات رسمية للماركات — تُستخدم في صفحة الهواتف وقطع الغيار
 */
export const BRAND_OFFICIAL_LOGOS: Record<string, string> = {
  apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  samsung: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Samsung_logo_blue.png",
  xiaomi: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
  oppo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/OPPO_LOGO_2019.svg",
  huawei: "https://upload.wikimedia.org/wikipedia/commons/0/07/Huawei_wordmark.svg",
  infinix: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Infinix_logo.svg",
  google: "https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_92x30px.svg",
  realme: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Realme_logo.svg",
  oneplus: "https://upload.wikimedia.org/wikipedia/commons/a/a4/OnePlus_logo.png",
  redmi: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Redmi_Logo.svg",
  motorola: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Motorola_Logo_2014.svg",
  vivo: "https://upload.wikimedia.org/wikipedia/commons/1/13/Vivo_logo_2019.svg",
  ace: "https://yt3.googleusercontent.com/UZvBWiNHfS-kEEDHkq6DXHYAj9P0b7wLGlvi1C6jvuEUL2RvI1Bq2w1OxS_wPyLFyEOPMwJqUA=s900-c-k-c0x00ffffff-no-rj",
  tecno: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Tecno_Mobile_logo.svg",
  nokia: "https://upload.wikimedia.org/wikipedia/commons/0/02/Nokia_wordmark.svg",
  lg: "https://upload.wikimedia.org/wikipedia/commons/8/8d/LG_logo_%282014%29.svg",
  condor: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Condor_Electronics_Logo.svg",
  itel: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Itel_Mobile_logo_2023.svg",
  honor: "https://upload.wikimedia.org/wikipedia/commons/2/20/Honor_Logo_%282020%29.svg",
  poco: "https://upload.wikimedia.org/wikipedia/commons/7/78/Poco_Smartphone_Company_logo.svg",
  // أسماء عربية أو بدائل شائعة
  سامسونج: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Samsung_logo_blue.png",
  ابل: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  شاومي: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
  هواوي: "https://upload.wikimedia.org/wikipedia/commons/0/07/Huawei_wordmark.svg",
  أوبو: "https://upload.wikimedia.org/wikipedia/commons/0/0a/OPPO_LOGO_2019.svg",
  نوكيا: "https://upload.wikimedia.org/wikipedia/commons/0/02/Nokia_wordmark.svg",
  ريدمي: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Redmi_Logo.svg",
  تكنو: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Tecno_Mobile_logo.svg",
  انفينكس: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Infinix_logo.svg",
  ريلمي: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Realme_logo.svg",
  فيفو: "https://upload.wikimedia.org/wikipedia/commons/1/13/Vivo_logo_2019.svg",
  "وان بلس": "https://upload.wikimedia.org/wikipedia/commons/a/a4/OnePlus_logo.png",
  موتورولا: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Motorola_Logo_2014.svg",
};

/**
 * إرجاع رابط الشعار الرسمي للماركة حسب الاسم أو السلوق.
 */
export function getOfficialBrandLogo(nameOrSlug: string | undefined, imageFromApi?: string): string | undefined {
  const fromApi = imageFromApi?.trim();
  if (fromApi) return fromApi;
  if (!nameOrSlug) return undefined;
  const trimmed = nameOrSlug.trim();
  const key = trimmed.toLowerCase().replace(/\s+/g, "-");
  return BRAND_OFFICIAL_LOGOS[key] ?? BRAND_OFFICIAL_LOGOS[trimmed];
}
