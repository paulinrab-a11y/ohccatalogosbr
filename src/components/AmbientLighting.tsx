/* Luz ambiente da página inteira: dois halos e dois feixes diagonais (azul OHC da esquerda, vermelho OHC da direita),
   fixos atrás de todo o conteúdo, respirando devagar. CSS puro; desliga o movimento com reduced-motion. */
export default function AmbientLighting() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ohc-bg"
      aria-hidden="true"
    >
      <div className="dg dg-blue" />
      <div className="dg dg-red" />
      <div className="beam beam-blue" />
      <div className="beam beam-red" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_120%,rgba(11,13,17,.9),transparent_60%)]" />
    </div>
  );
}
