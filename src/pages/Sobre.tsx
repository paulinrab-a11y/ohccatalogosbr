/* Quem somos: who OHC Motors is and how a purchase works, in facts the store
   has confirmed (fabricação própria, estoque e expedição no Brás, atendimento
   pelo WhatsApp, link de pagamento InfinitePay, garantia e arrependimento,
   instaladores indicados em São Paulo). No numbers, reviews or dates that the
   store has not given. */
import { useEffect } from "react";
import Nav from "../components/Nav";
import Footer, { FloatingWA } from "../components/Footer";
import LiveryTitle from "../components/LiveryTitle";
import PurchaseSteps from "../components/PurchaseSteps";
import { Link } from "../lib/router";
import { waWithRef } from "../lib/attribution";
import { aboutHead, applySeo } from "../lib/seo";

const FACTS: [string, string][] = [
  [
    "Fabricação própria",
    "Os volantes esportivos são fabricados pela OHC Motors, em couro, fibra de carbono e Alcântara, para BMW, Mercedes-Benz, Audi, Ford Mustang, Porsche e outras marcas.",
  ],
  [
    "Estoque em São Paulo",
    "O estoque e a expedição ficam no Brás, em São Paulo, SP. Não há loja física nem atendimento presencial.",
  ],
  [
    "Atendimento pelo WhatsApp",
    "Uma pessoa da equipe confere a aplicação no seu carro, calcula o frete para o seu CEP e envia o link de pagamento.",
  ],
  [
    "Instalação",
    "A OHC não faz instalação. Em São Paulo indicamos instaladores que conhecem os nossos volantes; em outra cidade, orientamos o seu instalador pelo WhatsApp.",
  ],
];

export default function Sobre() {
  useEffect(() => {
    applySeo(aboutHead);
  }, []);
  return (
    <>
      <Nav />
      <LiveryTitle
        lines={["Quem é a", "OHC Motors"]}
        className="-mb-[3vw]"
        titleClass="text-[clamp(44px,10vw,96px)]"
      />
      <main className="wrap pb-16 md:pb-24">
        <p className="mt-4 max-w-[60ch] text-lg text-[#c9d0d8]">
          A OHC Motors fabrica volantes esportivos e vende grades, faróis e
          acessórios para carros esportivos e premium. Você escolhe pelo site e
          fecha o pedido com a equipe no WhatsApp, com envio para todo o Brasil.
        </p>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          {FACTS.map(([t, d]) => (
            <div key={t} className="decal p-5">
              <dt className="font-display text-[26px] leading-none tracking-wide">
                {t}
              </dt>
              <dd className="mt-2 text-[15px] text-[#c9d0d8]">{d}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start md:gap-12">
          <div>
            <h2 className="text-[clamp(36px,7vw,56px)]">Como comprar</h2>
            <p className="mt-3 max-w-[44ch] text-[#c9d0d8]">
              Nada é cobrado antes de a equipe conferir a aplicação no seu
              carro. O pagamento é pelo link da InfinitePay, no PIX com desconto
              ou no cartão.
            </p>
          </div>
          <PurchaseSteps heading={false} className="decal p-4 sm:p-6" />
        </div>

        <section aria-labelledby="contato" className="mt-12">
          <h2 id="contato" className="text-[clamp(36px,7vw,56px)]">
            Fale com a OHC
          </h2>
          <ul className="mt-4 grid gap-2 text-[15px]">
            <li>
              WhatsApp:{" "}
              <a
                className="font-bold text-[#3fd97a] underline underline-offset-4"
                href={waWithRef("Olá! Vim pelo site da OHC Motors.")}
                target="_blank"
                rel="noopener"
              >
                +55 11 95579-8211
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a
                className="font-bold text-[#afc8ff] underline underline-offset-4"
                href="https://www.instagram.com/ohcmotorsbr/"
                target="_blank"
                rel="noopener"
              >
                @ohcmotorsbr
              </a>{" "}
              <span className="text-ohc-steel">
                (vídeos de volantes instalados)
              </span>
            </li>
            <li>Estoque e expedição: Brás, São Paulo, SP (sem loja física)</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/catalogo" className="btn btn-blue">
              Ver o catálogo
            </Link>
            <Link href="/compatibilidade" className="btn btn-ghost">
              Confirmar compatibilidade
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWA />
    </>
  );
}
