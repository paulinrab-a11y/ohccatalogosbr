/* FAQ accordion — 21st.dev "FAQ" block pattern (shadcn Accordion look), rebuilt with native buttons + CSS grid rows. */
import { useState } from "react";
const ITEMS: [string, string][] = [
  [
    "Vocês têm loja física?",
    "Não. O endereço no Brás, em São Paulo, é estoque e expedição, sem atendimento presencial. O atendimento é pelo WhatsApp e enviamos para todo o Brasil.",
  ],
  [
    "Vocês fazem a instalação?",
    "Não fazemos instalação. Em São Paulo indicamos instaladores que já conhecem os nossos volantes. Em outra cidade, orientamos o seu instalador pelo WhatsApp.",
  ],
  [
    "O volante vem completo?",
    "Sim. O volante vai completo, com os comandos e o acabamento do modelo escolhido, pronto para instalar.",
  ],
  [
    "Quais são as formas de pagamento?",
    "PIX com desconto ou cartão em até 12x pela InfinitePay. Depois de confirmar a compatibilidade, enviamos o link de pagamento pelo WhatsApp.",
  ],
  [
    "Como funciona a garantia?",
    "São 90 dias de garantia contra defeito de fabricação e 7 dias para arrependimento, conforme o Código de Defesa do Consumidor.",
  ],
  [
    "Como sei se o volante serve no meu carro?",
    "Você informa marca, modelo, ano e versão e manda três fotos do volante atual. A equipe confere e diz qual SKU serve antes de você pagar.",
  ],
];
export default function FAQ() {
  const [open, setOpen] = useState<number>(0);
  return (
    <div className="mx-auto max-w-[820px]">
      {ITEMS.map(([q, a], i) => (
        <div key={i} className="faq-item" data-open={open === i}>
          <button
            type="button"
            className="faq-q"
            aria-expanded={open === i}
            aria-controls={`faq-${i}`}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {q}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {/* Closed answers are only clipped visually; inert keeps them out of
              the accessibility tree, matching aria-expanded. */}
          <div
            id={`faq-${i}`}
            className="faq-a"
            {...(open === i ? {} : { inert: "" })}
          >
            <div>{a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
