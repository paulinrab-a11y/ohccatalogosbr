/* How a purchase actually goes, next to the buy button: the site starts the
   order, WhatsApp closes it. Every line is a confirmed store practice (link de
   pagamento InfinitePay, compatibilidade conferida antes de pagar, garantia e
   arrependimento, envio de São Paulo); nothing here promises a deadline. */
const PURCHASE_STEPS: [string, string][] = [
  [
    "Chame no WhatsApp",
    "A mensagem já vai com o volante, o preço e o seu carro.",
  ],
  [
    "A equipe confere",
    "Aplicação no seu carro e frete para o seu CEP, antes de qualquer pagamento.",
  ],
  [
    "Pague pelo link",
    "Link oficial da InfinitePay: PIX com desconto ou cartão em 3x sem juros (até 12x com juros).",
  ],
  ["Receba em casa", "Enviamos de São Paulo para todo o Brasil."],
];

const GUARANTEES = [
  "Garantia de 90 dias contra defeito",
  "7 dias para arrependimento (CDC)",
  "Fabricação própria OHC Motors",
];

export default function PurchaseSteps({
  className = "",
  heading = true,
}: {
  className?: string;
  /** Off where the page already titles the block. */
  heading?: boolean;
}) {
  return (
    <section
      aria-labelledby={heading ? "como-comprar" : undefined}
      aria-label={heading ? undefined : "Como funciona a compra"}
      className={className}
    >
      {heading && (
        <h2
          id="como-comprar"
          className="font-body text-sm font-bold text-ohc-text"
        >
          Como funciona a compra
        </h2>
      )}
      <ol className={`${heading ? "mt-3" : ""} grid gap-3`}>
        {PURCHASE_STEPS.map(([title, text], i) => (
          <li key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-sm bg-[#182033] font-display text-lg leading-none text-white shadow-[inset_0_0_0_1px_#214fa1]"
            >
              {i + 1}
            </span>
            <span className="text-sm">
              <b className="font-bold">{title}.</b>{" "}
              <span className="text-[#c9d0d8]">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-[#c9d0d8]">
        {GUARANTEES.map((g) => (
          <li key={g} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="livery livery-rule w-4 shrink-0 rounded-sm"
            />
            {g}
          </li>
        ))}
      </ul>
    </section>
  );
}
