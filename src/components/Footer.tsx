/* CTA + Footer — 21st.dev "Call to action" and "Footer" block patterns. */
import { Link } from "../lib/router";
import { waLink } from "../lib/products";
export function FinalCTA() {
  return (
    <section className="relative py-20 md:py-28 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_20%_50%,rgba(33,79,161,.28),transparent_70%),radial-gradient(40%_60%_at_80%_50%,rgba(237,28,36,.2),transparent_70%)]" />
      <div className="wrap relative">
        <p className="eyebrow">Pronto para o seu carro</p>
        <h2 className="mx-auto mt-3 max-w-[16ch] text-[clamp(44px,9vw,110px)]">
          Fale com a OHC e confirme a aplicação.
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-ohc-steel">
          Mande o modelo, o ano e três fotos do volante atual. A equipe confirma
          o SKU e envia o link de pagamento no PIX com desconto ou no cartão em
          até 12x.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            className="ub-wa text-base px-7 py-4"
            href={waLink(
              "Olá! Quero confirmar a compatibilidade de um produto OHC Motors.",
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
          <img src="/ohc-logo.webp" alt="OHC Motors" className="mb-4 h-8" />
          <p>
            Volantes esportivos de fabricação própria, grades, faróis e
            acessórios. Confirmamos a aplicação de cada produto antes do envio.
          </p>
          <p className="mt-2">
            PIX com desconto ou cartão em até 12x pela InfinitePay. Garantia de
            90 dias contra defeito e 7 dias para arrependimento.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-body text-[13px] font-bold text-ohc-text">
            Navegar
          </h4>
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
          <h4 className="mb-3 font-body text-[13px] font-bold text-ohc-text">
            Atendimento
          </h4>
          <ul className="grid gap-1.5">
            <li>
              <a
                href={waLink("Olá! Vim pelo site da OHC Motors.")}
                target="_blank"
                rel="noopener"
              >
                WhatsApp +55 11 95579-8211
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/ohcmotors"
                target="_blank"
                rel="noopener"
              >
                Instagram @ohcmotors
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
export function FloatingWA() {
  return (
    <a
      href={waLink(
        "Olá! Vim pelo site da OHC Motors e quero mais informações.",
      )}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-[#0B2416] shadow-[0_8px_30px_rgba(0,0,0,.45)] md:h-auto md:w-auto md:rounded-md md:px-5 md:py-3 md:text-sm md:font-bold"
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
