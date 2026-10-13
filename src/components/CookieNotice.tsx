/* First-visit cookie notice (LGPD). Informational: it never blocks the page.
   Shown only when the Meta Pixel is configured, since that is what sets cookies. */
import { useEffect, useState } from "react";
import { pixelEnabled } from "../lib/pixel";

const KEY = "ohc-cookies-ok";

export default function CookieNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!pixelEnabled()) return;
    try {
      setOpen(!localStorage.getItem(KEY));
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage blocked: the notice shows again next visit */
    }
    setOpen(false);
  };
  return (
    <aside
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[560px] items-center gap-3 rounded-md border border-ohc-line bg-ohc-bg2 px-4 py-3 text-[13px] text-[#c9d0d8] shadow-[0_8px_24px_rgba(0,0,0,.45)] md:bottom-5"
    >
      <p className="flex-1">
        Usamos cookies para medir os anúncios e melhorar o site.
      </p>
      <button
        type="button"
        onClick={close}
        className="btn btn-ghost min-h-10 shrink-0 px-4 py-2 text-[13px]"
      >
        Entendi
      </button>
    </aside>
  );
}
