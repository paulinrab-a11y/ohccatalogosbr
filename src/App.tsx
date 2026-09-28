import { lazy, Suspense, useEffect } from "react";
import { RouterProvider, useRoute } from "./lib/router";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Produto from "./pages/Produto";
import Compatibilidade from "./pages/Compatibilidade";
import { reduced } from "./lib/motion";
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
function Pages() {
  const { route } = useRoute();
  useEffect(() => {
    if (reduced()) return;
    let disposed = false;
    let lenis: import("lenis").default | undefined;
    void import("lenis")
      .then(async ({ default: Lenis }) => {
        if (disposed) return;
        lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: true });
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        if (!disposed) lenis.on("scroll", ScrollTrigger.update);
      })
      .catch(() => {});
    return () => {
      disposed = true;
      lenis?.destroy();
    };
  }, []);
  if (route.path === "/admin/login")
    return (
      <Suspense
        fallback={<main className="wrap py-16">Carregando acesso…</main>}
      >
        <AdminLogin />
      </Suspense>
    );
  if (route.path === "/admin" || route.path.startsWith("/admin/"))
    return (
      <Suspense
        fallback={<main className="wrap py-16">Carregando painel…</main>}
      >
        <Admin />
      </Suspense>
    );
  if (route.path === "/catalogo")
    return <Catalogo key={route.search.toString()} />;
  if (route.path === "/produto")
    return <Produto key={route.search.toString()} />;
  if (route.path === "/compatibilidade") return <Compatibilidade />;
  if (route.path === "/") return <Home />;
  return (
    <main className="wrap py-16">
      <h1>Página não encontrada</h1>
      <a href="/">Voltar ao início</a>
    </main>
  );
}
export default function App() {
  return (
    <RouterProvider>
      <Pages />
    </RouterProvider>
  );
}
