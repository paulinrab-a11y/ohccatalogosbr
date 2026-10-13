/* Static first paint of a product page, written into the build-time HTML so
   the photo shows before the app's JavaScript arrives (it is the page's LCP).
   React replaces it on load with the real page, laid out the same way. Pure
   markup: no hooks, no prices (they change without a deploy). */
import LiveryTitle from "./LiveryTitle";
import { small, type Product } from "../lib/products";

const KIND: Record<string, string> = {
  Volantes: "Volante",
  Grades: "Grade",
  "Faróis & Lanternas": "Farol e lanterna",
  Acessórios: "Acessório",
};

export default function ProductShell({ p }: { p: Product }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ohc-line bg-ohc-bg">
        <div className="wrap flex h-[68px] items-center">
          <a href="/" aria-label="OHC Motors, início">
            <img
              src="/ohc-logo.webp"
              alt="OHC Motors"
              width={500}
              height={209}
              className="h-[34px] w-auto"
            />
          </a>
        </div>
      </header>
      <LiveryTitle
        as="p"
        lines={[KIND[p.category] || p.category, p.brand]}
        className="-mb-[3vw] md:-mb-[1vw]"
        titleClass="text-[clamp(30px,8vw,84px)]"
      />
      <div className="wrap grid gap-6 pb-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
        <div className="decal relative min-w-0 overflow-hidden">
          {p.image ? (
            <img
              src={p.image}
              srcSet={`${small(p.image)} 560w, ${p.image} 1000w`}
              sizes="(min-width: 768px) 50vw, 100vw"
              alt={p.name}
              width={1000}
              height={750}
              fetchPriority="high"
              className="aspect-[4/3] w-full bg-[#0e1116] object-contain p-[4%] md:aspect-square md:p-[6%]"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center font-display text-3xl text-[#3A4350] md:aspect-square">
              Foto em breve
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-xs text-[#c9d0d8]">Catálogo / {p.brand}</p>
          <h1 className="max-w-[18ch] text-[clamp(32px,8.5vw,48px)] md:text-[clamp(40px,5vw,64px)]">
            {p.name}
          </h1>
          <p className="mt-4 text-sm text-[#c9d0d8]">Carregando preço…</p>
        </div>
      </div>
    </>
  );
}
