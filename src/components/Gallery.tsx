/* Galeria: grades e volantes do catálogo em carros, fotos enviadas pela loja.
   Two rows of photos that the visitor moves, never a loop playing by itself
   (DESIGN.md refuses marquees). Wide screens with motion allowed: the section
   pins and vertical scroll slides the rows sideways (GSAP ScrollTrigger, scrub,
   ease "none", transform only). Phones, small windows and reduced motion: the
   same rows are a native swipeable strip, nothing moves on its own. */
import { useEffect, useRef } from "react";

const PHOTOS: [string, string][] = [
  ["01", "Volante Mercedes-AMG com LED no aro, durante a instalação"],
  ["02", "Grade Panamericana com LED em Mercedes-Benz GLC branco"],
  ["03", "Volante Mercedes-AMG em couro instalado"],
  ["04", "Grade Panamericana com LED em Mercedes-Benz GLC cinza"],
  ["05", "Volante BMW M instalado em BMW Série 3"],
  ["06", "Grade Panamericana com LED em Mercedes-Benz Classe C branco"],
  ["07", "Volante Mercedes-AMG em carbono e couro instalado"],
  ["08", "Mercedes-Benz GLC cinza com grade Panamericana com LED, de frente"],
  ["09", "Grade com LED acesa em Mercedes-Benz Classe C branco"],
  ["10", "Mercedes-Benz GLC branco com grade Panamericana com LED"],
  ["11", "Grade Panamericana em Mercedes-Benz Classe C preto"],
  ["12", "Detalhe da grade Panamericana com LED em GLC cinza"],
  ["13", "Mercedes-Benz Classe C branco com grade Panamericana com LED"],
  ["14", "Mercedes-Benz GLC branco com grade com LED, de frente"],
  ["15", "Grade com LED acesa em GLC cinza"],
  ["16", "Mercedes-Benz Classe C branco com grade com LED, de frente"],
  ["17", "Mercedes-Benz GLC branco com faróis e grade com LED acesos"],
  ["18", "Mercedes-Benz GLC cinza com grade com LED"],
  ["19", "Detalhe da grade com LED em GLC branco"],
  ["20", "Detalhe da grade Panamericana em Mercedes-Benz Classe C branco"],
];

export default function Gallery() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let revert: (() => void) | undefined;
    void (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (disposed || !section.current || !track.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
        () => {
          const el = track.current!;
          // How far the rows travel: everything past the viewport, read again
          // on every refresh (resize, fonts, images).
          const distance = () =>
            Math.max(0, el.scrollWidth - el.parentElement!.clientWidth);
          gsap.to(el, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section.current,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              // The 3D hero above pins too and is created later; measure
              // after it so this start is not taken from a shorter page.
              refreshPriority: -1,
            },
          });
        },
      );
      // The hero changes height when the 3D loads or falls back to a photo;
      // every pin below must measure again when the page height moves.
      let timer = 0;
      const ro = new ResizeObserver(() => {
        clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
      });
      ro.observe(document.body);
      revert = () => {
        clearTimeout(timer);
        ro.disconnect();
        mm.revert();
      };
    })();
    return () => {
      disposed = true;
      revert?.();
    };
  }, []);
  return (
    <section
      ref={section}
      aria-labelledby="galeria"
      className="overflow-hidden border-y border-ohc-line bg-ohc-bg2 lg:flex lg:h-svh lg:flex-col lg:justify-center"
    >
      <div className="wrap pt-14 lg:pt-0">
        <h2
          id="galeria"
          className="text-[clamp(36px,8vw,64px)] md:text-[clamp(40px,4.6vw,72px)]"
        >
          Instalados
        </h2>
        <p className="mt-2 max-w-[52ch] text-[#c9d0d8]">
          Grades e volantes do catálogo, já nos carros.{" "}
          <span className="lg:hidden">Arraste para ver as fotos.</span>
          <span className="hidden lg:inline">Role a página para ver.</span>
        </p>
      </div>
      {/* Phones: the strip scrolls natively. Wide screens: GSAP moves it. */}
      <div className="mt-6 overflow-x-auto pb-14 [scrollbar-width:none] lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden motion-reduce:lg:overflow-x-auto motion-reduce:lg:pb-6">
        <div
          ref={track}
          className="grid w-max grid-flow-col grid-rows-2 gap-3 px-5 will-change-transform sm:px-8 lg:gap-4 lg:px-12"
        >
          {PHOTOS.map(([n, alt]) => (
            <figure
              key={n}
              className="decal m-0 aspect-[3/4] h-[clamp(190px,30svh,300px)] overflow-hidden lg:h-[clamp(220px,34svh,330px)]"
            >
              <img
                src={`/img/galeria/${n}.webp`}
                alt={alt}
                width={560}
                height={746}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
