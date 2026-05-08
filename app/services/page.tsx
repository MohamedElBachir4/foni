import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShoppingBag, Truck, Wrench, ShieldCheck, LifeBuoy } from "lucide-react";

const services = [
  {
    title: "بيع الهواتف والإكسسوارات",
    description:
      "تشكيلة واسعة من الهواتف الذكية والإكسسوارات الموثوقة بأسعار تنافسية.",
    icon: ShoppingBag,
  },
  {
    title: "قطع غيار أصلية",
    description:
      "توفير قطع غيار متوافقة مع مختلف الماركات لضمان جودة الصيانة.",
    icon: Wrench,
  },
  {
    title: "التوصيل والمتابعة",
    description:
      "خدمة توصيل ودعم للطلبات مع متابعة حتى وصول منتجك بأمان.",
    icon: Truck,
  },
  {
    title: "حسابات مهنية",
    description:
      "برامج للصناعيين والتجار (تاجر أو صاحب محل و Grossiste) مع عروض مخصصة.",
    icon: ShieldCheck,
  },
  {
    title: "دعم واستشارة",
    description:
      "فريق جاهز لمساعدتك في اختيار القطعة أو المنتج المناسب لاحتياجك.",
    icon: LifeBuoy,
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-4xl">
            خدماتنا
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            <span className="font-bold text-slate-800">FONI</span> متجر متخصص
            في عالم الهواتف: نوفر لك تجربة شراء موثوقة تجمع بين الجودة،
            التنوع، والخدمة التي تليق بعملائنا في الجزائر وخارجها عبر البيع
            أونلاين.
          </p>
        </header>

        <div className="mb-10 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-10">
          <h2 className="mb-4 text-lg font-bold text-slate-900 sm:text-xl">
            من نحن
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            نسعى لأن نكون وجهتك الأولى عند البحث عن هاتف جديد، إكسسوار يحمي
            جهازك، أو قطعة غيار تضمن أداءً طويل الأمد. نعمل على اختيار
            الموردين والمنتجات بعناية لنقدّم لك قيمة حقيقية وثقة في كل طلب.
          </p>
        </div>

        <section>
          <h2 className="mb-6 text-lg font-bold text-slate-900 sm:text-xl">
            ما يميز متجرنا
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {services.map(({ title, description, icon: Icon }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-md">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
