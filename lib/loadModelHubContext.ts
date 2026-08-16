import { notFound } from "next/navigation";
import { publicFetch } from "@/lib/publicFetch";
import { logServerError } from "@/lib/serverLog";

const MONGO_ID = /^[a-f0-9]{24}$/i;

export type ModelHubContext = {
  brandParam: string;
  brandName: string;
  brandMongoId: string;
  modelName: string;
  phoneTypeId: string;
};

type PhoneTypeOne = {
  _id: string;
  name: string;
  brand?: { _id: string; name: string; slug?: string } | null;
};

function brandParamMatchesPhoneType(brandParam: string, pt: PhoneTypeOne) {
  const b = pt.brand;
  if (!b) return true;
  const slug = (b.slug || "").toLowerCase().trim();
  if (slug && slug === brandParam) return true;
  const name = (b.name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return name === brandParam;
}

export async function loadModelHubContext(
  brand: string,
  phoneTypeId: string
): Promise<ModelHubContext> {
  const brandParam = brand.toLowerCase();
  if (!MONGO_ID.test(phoneTypeId)) notFound();

  let res: Response;
  try {
    res = await publicFetch(`/api/phone-types/${phoneTypeId}`, {
      cache: "no-store",
    });
  } catch (err) {
    logServerError(err, {
      route: "lib/loadModelHubContext.ts",
      pathname: `/brand/${brandParam}/model/${phoneTypeId}`,
      params: { brand: brandParam, phoneTypeId },
      extra: { stage: "fetch-throw" },
    });
    throw new Error("تعذّر الاتصال بالخادم أثناء تحميل الموديل");
  }
  if (res.status === 404) notFound();
  if (!res.ok) {
    logServerError(new Error(`upstream ${res.status} for /api/phone-types/${phoneTypeId}`), {
      route: "lib/loadModelHubContext.ts",
      pathname: `/brand/${brandParam}/model/${phoneTypeId}`,
      params: { brand: brandParam, phoneTypeId },
      extra: { stage: "non-ok-response", status: res.status },
    });
    throw new Error(`تعذّر تحميل الموديل (HTTP ${res.status})`);
  }
  const pt = (await res.json()) as PhoneTypeOne;
  if (!pt || !pt.brand?._id) notFound();
  if (!brandParamMatchesPhoneType(brandParam, pt)) notFound();

  return {
    brandParam,
    brandName: pt.brand?.name ?? brandParam,
    brandMongoId: pt.brand._id,
    modelName: pt.name,
    phoneTypeId,
  };
}
