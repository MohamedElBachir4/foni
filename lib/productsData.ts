export type Product = {
  id: string | number;
  name: string;
  price: number;
  brand: string;
  category: string;
  image: string;
};

const PHONE_IMAGE =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";

export const PRODUCTS: Product[] = [
  { id: 1, name: "iPhone 15 Pro Max", price: 145000, brand: "apple", category: "هواتف", image: PHONE_IMAGE },
  { id: 2, name: "iPhone 15", price: 98000, brand: "apple", category: "هواتف", image: PHONE_IMAGE },
  { id: 3, name: "iPhone 14 Plus", price: 82000, brand: "apple", category: "هواتف", image: PHONE_IMAGE },
  { id: 4, name: "Samsung Galaxy S24 Ultra", price: 125000, brand: "samsung", category: "هواتف", image: PHONE_IMAGE },
  { id: 5, name: "Samsung Galaxy S24", price: 78000, brand: "samsung", category: "هواتف", image: PHONE_IMAGE },
  { id: 6, name: "Samsung Galaxy A54", price: 42000, brand: "samsung", category: "هواتف", image: PHONE_IMAGE },
  { id: 7, name: "Xiaomi 14 Pro", price: 68000, brand: "xiaomi", category: "هواتف", image: PHONE_IMAGE },
  { id: 8, name: "Xiaomi Redmi Note 13 Pro", price: 35000, brand: "xiaomi", category: "هواتف", image: PHONE_IMAGE },
  { id: 9, name: "Xiaomi 13T", price: 52000, brand: "xiaomi", category: "هواتف", image: PHONE_IMAGE },
  { id: 10, name: "Oppo Find X7", price: 72000, brand: "oppo", category: "هواتف", image: PHONE_IMAGE },
  { id: 11, name: "Oppo Reno 11", price: 45000, brand: "oppo", category: "هواتف", image: PHONE_IMAGE },
  { id: 12, name: "Oppo A78", price: 28000, brand: "oppo", category: "هواتف", image: PHONE_IMAGE },
  { id: 13, name: "Huawei Mate 60 Pro", price: 95000, brand: "huawei", category: "هواتف", image: PHONE_IMAGE },
  { id: 14, name: "Huawei P60 Pro", price: 65000, brand: "huawei", category: "هواتف", image: PHONE_IMAGE },
  { id: 15, name: "Huawei Nova 12", price: 38000, brand: "huawei", category: "هواتف", image: PHONE_IMAGE },
  { id: 16, name: "Infinix Note 40 Pro", price: 22000, brand: "infinix", category: "هواتف", image: PHONE_IMAGE },
  { id: 17, name: "Infinix Hot 40", price: 15000, brand: "infinix", category: "هواتف", image: PHONE_IMAGE },
  { id: 18, name: "Infinix Zero 30", price: 32000, brand: "infinix", category: "هواتف", image: PHONE_IMAGE },
  { id: 19, name: "Google Pixel 8 Pro", price: 88000, brand: "google", category: "هواتف", image: PHONE_IMAGE },
  { id: 20, name: "Google Pixel 8", price: 62000, brand: "google", category: "هواتف", image: PHONE_IMAGE },
  { id: 21, name: "Google Pixel 7a", price: 42000, brand: "google", category: "هواتف", image: PHONE_IMAGE },
  { id: 22, name: "Realme GT 5 Pro", price: 55000, brand: "realme", category: "هواتف", image: PHONE_IMAGE },
  { id: 23, name: "Realme 12 Pro+", price: 38000, brand: "realme", category: "هواتف", image: PHONE_IMAGE },
  { id: 24, name: "Realme C55", price: 18000, brand: "realme", category: "هواتف", image: PHONE_IMAGE },
  { id: 25, name: "OnePlus 12", price: 75000, brand: "oneplus", category: "هواتف", image: PHONE_IMAGE },
  { id: 26, name: "OnePlus Nord 3", price: 42000, brand: "oneplus", category: "هواتف", image: PHONE_IMAGE },
  { id: 27, name: "OnePlus 11R", price: 48000, brand: "oneplus", category: "هواتف", image: PHONE_IMAGE },
  { id: 28, name: "Redmi Note 13 Pro+", price: 35000, brand: "redmi", category: "هواتف", image: PHONE_IMAGE },
  { id: 29, name: "Redmi 13C", price: 14000, brand: "redmi", category: "هواتف", image: PHONE_IMAGE },
  { id: 30, name: "Redmi K70", price: 52000, brand: "redmi", category: "هواتف", image: PHONE_IMAGE },
  { id: 31, name: "Motorola Edge 40 Pro", price: 58000, brand: "motorola", category: "هواتف", image: PHONE_IMAGE },
  { id: 32, name: "Motorola G84", price: 28000, brand: "motorola", category: "هواتف", image: PHONE_IMAGE },
  { id: 33, name: "Motorola Razr 40", price: 72000, brand: "motorola", category: "هواتف", image: PHONE_IMAGE },
  { id: 34, name: "Vivo X100 Pro", price: 68000, brand: "vivo", category: "هواتف", image: PHONE_IMAGE },
  { id: 35, name: "Vivo V30", price: 35000, brand: "vivo", category: "هواتف", image: PHONE_IMAGE },
  { id: 36, name: "Vivo Y36", price: 20000, brand: "vivo", category: "هواتف", image: PHONE_IMAGE },
  { id: 37, name: "Ace N55", price: 16000, brand: "ace", category: "هواتف", image: PHONE_IMAGE },
  { id: 38, name: "Ace N50", price: 12000, brand: "ace", category: "هواتف", image: PHONE_IMAGE },
  { id: 39, name: "Ace Pro 5G", price: 28000, brand: "ace", category: "هواتف", image: PHONE_IMAGE },
  { id: 40, name: "Tecno Phantom X2", price: 45000, brand: "tecno", category: "هواتف", image: PHONE_IMAGE },
  { id: 41, name: "Tecno Camon 20", price: 22000, brand: "tecno", category: "هواتف", image: PHONE_IMAGE },
  { id: 42, name: "Tecno Spark 10", price: 14000, brand: "tecno", category: "هواتف", image: PHONE_IMAGE },
  { id: 43, name: "Nokia X30", price: 42000, brand: "nokia", category: "هواتف", image: PHONE_IMAGE },
  { id: 44, name: "Nokia G42", price: 22000, brand: "nokia", category: "هواتف", image: PHONE_IMAGE },
  { id: 45, name: "Nokia C32", price: 13000, brand: "nokia", category: "هواتف", image: PHONE_IMAGE },
  { id: 46, name: "LG Velvet", price: 38000, brand: "lg", category: "هواتف", image: PHONE_IMAGE },
  { id: 47, name: "LG K92", price: 20000, brand: "lg", category: "هواتف", image: PHONE_IMAGE },
  { id: 48, name: "LG Wing", price: 55000, brand: "lg", category: "هواتف", image: PHONE_IMAGE },
  { id: 49, name: "Condor Plume L8", price: 18000, brand: "condor", category: "هواتف", image: PHONE_IMAGE },
  { id: 50, name: "Condor Griffe G5", price: 12000, brand: "condor", category: "هواتف", image: PHONE_IMAGE },
  { id: 51, name: "Condor A8", price: 9000, brand: "condor", category: "هواتف", image: PHONE_IMAGE },
  { id: 52, name: "Itel P55", price: 11000, brand: "itel", category: "هواتف", image: PHONE_IMAGE },
  { id: 53, name: "Itel A70", price: 8500, brand: "itel", category: "هواتف", image: PHONE_IMAGE },
  { id: 54, name: "Itel S23", price: 15000, brand: "itel", category: "هواتف", image: PHONE_IMAGE },
  { id: 55, name: "Honor Magic 6 Pro", price: 72000, brand: "honor", category: "هواتف", image: PHONE_IMAGE },
  { id: 56, name: "Honor 90", price: 38000, brand: "honor", category: "هواتف", image: PHONE_IMAGE },
  { id: 57, name: "Honor X9b", price: 28000, brand: "honor", category: "هواتف", image: PHONE_IMAGE },
  { id: 58, name: "Poco F6 Pro", price: 48000, brand: "poco", category: "هواتف", image: PHONE_IMAGE },
  { id: 59, name: "Poco X6 Pro", price: 35000, brand: "poco", category: "هواتف", image: PHONE_IMAGE },
  { id: 60, name: "Poco M6 Pro", price: 22000, brand: "poco", category: "هواتف", image: PHONE_IMAGE },
];

const BRAND_LABELS: Record<string, string> = {
  apple: "Apple",
  samsung: "Samsung",
  xiaomi: "Xiaomi",
  oppo: "Oppo",
  huawei: "Huawei",
  infinix: "Infinix",
  google: "Google",
  realme: "Realme",
  oneplus: "OnePlus",
  redmi: "Redmi",
  motorola: "Motorola",
  vivo: "Vivo",
  ace: "Ace",
  tecno: "Tecno",
  nokia: "Nokia",
  lg: "LG",
  condor: "Condor",
  itel: "Itel",
  honor: "Honor",
  poco: "Poco",
};

export function getProductById(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getBrandLabel(brandId: string): string {
  return BRAND_LABELS[brandId.toLowerCase()] ?? brandId;
}
