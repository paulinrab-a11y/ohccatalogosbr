/* /promocoes: exists only while some promotion is running. With none (or once
   the last one ends) it sends the visitor to the catalog; never an empty page. */
import { useEffect } from "react";
import Nav from "../components/Nav";
import Footer, { FloatingWA } from "../components/Footer";
import ProductCard from "../components/ProductCard";
import LiveryTitle from "../components/LiveryTitle";
import { usePromotions } from "../lib/products";
import { applySeo, promotionsHead } from "../lib/seo";

export default function Promocoes() {
  const { promos, loading } = usePromotions();
  useEffect(() => {
    if (loading) return;
    if (!promos.length) {
      // Replace, not push: the back button must not loop through this page.
      history.replaceState(null, "", "/catalogo");
      dispatchEvent(new PopStateEvent("popstate"));
      return;
    }
    applySeo(promotionsHead);
  }, [loading, promos.length]);
  return (
    <>
      <Nav />
      <LiveryTitle
        lines={["Promoções", "por tempo limitado"]}
        className="-mb-[3vw]"
        titleClass="text-[clamp(46px,11vw,100px)]"
      />
      <main className="wrap pb-16 md:pb-24">
        <p className="mb-6 text-sm text-[#c9d0d8]" aria-live="polite">
          {loading
            ? "Carregando ofertas…"
            : `${promos.length} ${promos.length === 1 ? "produto em oferta" : "produtos em oferta"}`}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {promos.map((p) => (
            <ProductCard key={p.sku} p={p} />
          ))}
        </div>
      </main>
      <Footer />
      <FloatingWA />
    </>
  );
}
