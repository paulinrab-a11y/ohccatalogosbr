/* Navbar + full-screen mobile menu — 21st.dev navbar/mobile-nav block pattern (shadcn style), rebuilt without Radix. */
import { useEffect, useState, useRef } from "react";
import { Link, useRoute } from "../lib/router";
import { waLink } from "../lib/products";
import { useCustomerAuth } from "../lib/customerAuth";
const LINKS = [
  ["/catalogo?categoria=Volantes", "Volantes"],
  ["/catalogo?categoria=Grades", "Grades"],
  ["/compatibilidade", "Compatibilidade"],
  ["/catalogo", "Catálogo"],
];
export default function Nav({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const customer = useCustomerAuth();
  const accountHref = customer.user ? "/minha-conta" : "/conta";
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(!transparent);
  const { route } = useRoute();
  useEffect(() => {
    if (!transparent) return;
    const on = () => setSolid(scrollY > innerHeight * 0.6);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [transparent]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items =
        menuRef.current?.querySelectorAll<HTMLElement>("a[href],button");
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", trap);
    return () => {
      removeEventListener("keydown", trap);
      openRef.current?.focus();
    };
  }, [open]);
  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-colors duration-500 ${solid ? "bg-ohc-bg/85 backdrop-blur-md border-b border-ohc-line" : "bg-transparent"}`}
      >
        <div className="wrap flex h-[68px] items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center"
            aria-label="OHC Motors, início"
          >
            <img
              src="/ohc-logo.webp"
              alt="OHC Motors"
              className="h-[34px] w-auto"
            />
          </Link>
          <nav
            className="hidden lg:flex gap-5 text-[13px] font-semibold"
            aria-label="Navegação"
          >
            {LINKS.map(([h, l]) => (
              <Link
                key={h}
                href={h}
                className={`py-1.5 border-b-2 ${route.path + route.search.toString() === h ? "border-ohc-glow" : "border-transparent hover:text-white"}`}
              >
                {l}
              </Link>
            ))}
          </nav>
          <Link
            href={accountHref}
            className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap min-h-11"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
            </svg>
            {customer.user ? "Minha conta" : "Entrar"}
          </Link>
          <a
            className="ub-wa hidden lg:inline-flex"
            href={waLink(
              "Olá! Vim pelo site da OHC Motors e quero mais informações.",
            )}
            target="_blank"
            rel="noopener"
          >
            WhatsApp
          </a>
          <button
            type="button"
            ref={openRef}
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="lg:hidden grid h-11 w-11 place-items-center rounded-lg border border-ohc-line bg-ohc-bg/60"
          >
            <span className="block h-0.5 w-[18px] bg-white mb-[5px]" />
            <span className="block h-0.5 w-[18px] bg-white mb-[5px]" />
            <span className="block h-0.5 w-[18px] bg-white" />
          </button>
        </div>
      </header>
      <div
        ref={menuRef}
        role="dialog"
        aria-modal={open || undefined}
        aria-label="Menu de navegação"
        className={`fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-ohc-bg px-5 pb-8 pt-4 transition-[opacity,transform] duration-300 ${open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"}`}
        aria-hidden={!open}
        {...(!open ? { inert: "" } : {})}
      >
        <div className="flex h-[52px] items-center justify-between">
          <img src="/ohc-logo.webp" alt="" className="h-[34px]" />
          <button
            type="button"
            ref={closeRef}
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="grid h-11 w-11 place-items-center rounded-lg border border-white/20 text-2xl"
          >
            ×
          </button>
        </div>
        <nav className="mt-[8vh] grid" aria-label="Navegação móvel">
          {[...LINKS, [accountHref, "Minha conta"]].map(([h, l], i) => (
            <Link
              key={h}
              href={h}
              onClick={() => setOpen(false)}
              className="flex min-h-[64px] items-center gap-4 border-t border-ohc-line font-display text-[clamp(38px,11vw,54px)] tracking-wide last:border-b"
            >
              <span className="font-body text-[13px] tracking-[0.2em] text-ohc-glow">
                0{i + 1}
              </span>
              {l}
            </Link>
          ))}
        </nav>
        <a
          className="ub-wa mt-auto"
          href={waLink(
            "Olá! Vim pelo site da OHC Motors e quero mais informações.",
          )}
          target="_blank"
          rel="noopener"
        >
          Falar no WhatsApp
        </a>
        <p className="mt-3 text-center text-xs text-ohc-steel">
          Fabricação própria · São Paulo, SP
        </p>
      </div>
    </>
  );
}
