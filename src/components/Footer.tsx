/* Final call to action on the livery stripe, footer and floating WhatsApp. */
import { useEffect, useState } from "react";
import { Link } from "../lib/router";
import LiveryTitle from "./LiveryTitle";
import { waWithRef } from "../lib/attribution";
import { greeting, useMyCar } from "../lib/myCar";
import { track } from "../lib/pixel";
export function FinalCTA() {
  const car = useMyCar();
  return (
    <section className="py-12 md:py-20">
      {/* The same stripe that opens the page closes it. */}
      <LiveryTitle
        as="h2"
        lines={["Confirme a aplicação", "no seu carro"]}
        titleClass="text-[clamp(40px,10vw,112px)]"
      />
      <div className="wrap mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <p className="max-w-[52ch] text-[#c9d0d8]">
          Mande o modelo, o ano e três fotos do volante atual. A equipe confirma
          o SKU e envia o link de pagamento no PIX com desconto ou no cartão em
          3x sem juros ou até 12x com juros.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="ub-wa px-7 py-4 text-base"
            onClick={() => track("Contact")}
            href={waWithRef(
              greeting(
                car,
                "Olá! Quero confirmar a compatibilidade de um produto OHC Motors.",
              ),
            )}
            target="_blank"
            rel="noopener"
          >
            Falar no WhatsApp
          </a>
          <Link href="/catalogo" className="btn btn-ghost">
            Catálogo completo
          </Link>
        </div>
      </div>
    </section>
  );
}
export default function Footer() {
  return (
    <footer className="border-t border-ohc-line">
      <div className="wrap grid gap-8 py-12 text-[13px] text-ohc-steel md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <img
            src="/ohc-logo.webp"
            alt="OHC Motors"
            width={500}
            height={209}
            loading="lazy"
            className="mb-4 h-8 w-auto"
          />
          <p>
            Volantes esportivos de fabricação própria, grades, faróis e
            acessórios. Confirmamos a aplicação de cada produto antes do envio.
          </p>
          <p className="mt-2">
            PIX com desconto ou cartão em 3x sem juros ou até 12x com juros pela
            InfinitePay. Garantia de 90 dias contra defeito e 7 dias para
            arrependimento.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-body text-[13px] font-bold text-ohc-text">
            Navegar
          </h2>
          <ul className="grid gap-1.5">
            <li>
              <Link href="/catalogo">Catálogo completo</Link>
            </li>
            <li>
              <Link href="/catalogo?categoria=Volantes">Volantes</Link>
            </li>
            <li>
              <Link href="/catalogo?categoria=Grades">Grades</Link>
            </li>
            <li>
              <Link href="/compatibilidade">Confirmar compatibilidade</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-body text-[13px] font-bold text-ohc-text">
            Atendimento
          </h2>
          <ul className="grid gap-1.5">
            <li>
              <a
                onClick={() => track("Contact")}
                href={waWithRef("Olá! Vim pelo site da OHC Motors.")}
                target="_blank"
                rel="noopener"
              >
                WhatsApp +55 11 95579-8211
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/ohcmotorsbr/"
                target="_blank"
                rel="noopener"
              >
                Instagram @ohcmotorsbr
              </a>
            </li>
            <li>Estoque em São Paulo, SP (sem loja física)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ohc-line">
        <p className="wrap py-6 pr-24 text-sm text-ohc-steel md:pr-48">
          Desenvolvido por{" "}
          <span className="font-semibold text-ohc-text">Whynot Visuals</span>
        </p>
      </div>
    </footer>
  );
}
/** On the home page the button waits until the visitor scrolls past the
    hero, so it never covers the car picker in the first screen. */
export function FloatingWA({ afterHero = false }: { afterHero?: boolean }) {
  const car = useMyCar();
  const [shown, setShown] = useState(!afterHero);
  useEffect(() => {
    if (!afterHero) return;
    const on = () => {
      const past = scrollY > innerHeight * 0.9;
      setShown((was) => (was === past ? was : past));
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [afterHero]);
  return (
    <a
      onClick={() => track("Contact")}
      href={waWithRef(greeting(car))}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      // Safe-area offsets keep the button above the iPhone home bar (viewport-fit=cover).
      tabIndex={shown ? undefined : -1}
      aria-hidden={shown ? undefined : true}
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-30 grid h-13 w-13 place-items-center rounded-full bg-[#25D366] text-[#0B2416] shadow-[0_6px_18px_rgba(0,0,0,.4)] transition-[opacity,transform] duration-200 md:h-auto md:w-auto md:rounded-md md:px-5 md:py-3 md:text-sm md:font-bold ${shown ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <svg
        className="h-6 w-6 md:hidden"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c-.1-.1-.2-.2-.5-.3z" />
      </svg>
      <span className="hidden md:inline">WhatsApp</span>
    </a>
  );
}
