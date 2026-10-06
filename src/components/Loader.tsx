/* Intro loader: DecryptedText (React Bits) + Uiverse-style dots loader; skippable; respects reduced motion; session-once. */
import { useEffect, useState } from "react";
import DecryptedText from "./DecryptedText";
import { reduced } from "../lib/motion";
// sessionStorage throws when the browser blocks site data; then skip the intro.
function introSeen() {
  try {
    return Boolean(sessionStorage.getItem("ohc-intro"));
  } catch {
    return true;
  }
}
function markIntroSeen() {
  try {
    sessionStorage.setItem("ohc-intro", "1");
  } catch {
    /* storage blocked: the intro simply shows again next time */
  }
}
export default function Loader({ ready }: { ready: boolean }) {
  const [show, setShow] = useState(() => !reduced() && !introSeen());
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!show) return;
    markIntroSeen();
    const t = setTimeout(() => setDone(true), 3200);
    return () => clearTimeout(t);
  }, [show]);
  useEffect(() => {
    if (show && ready) {
      const t = setTimeout(() => setDone(true), 1500);
      return () => clearTimeout(t);
    }
  }, [ready, show]);
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShow(false), 700);
      return () => clearTimeout(t);
    }
  }, [done]);
  if (!show) return null;
  return (
    <div
      className={`fixed inset-0 z-80 grid place-items-center bg-black transition-opacity duration-700 ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Only the logo animation is decorative; the skip button stays reachable. */}
      <div className="text-center" aria-hidden="true">
        <div className="font-display leading-none">
          <span className="block text-[clamp(88px,20vw,220px)] tracking-[0.06em] text-ohc-blue">
            <DecryptedText text="OHC" speed={70} characters="0123456789OHC#%" />
          </span>
          <span className="block text-[clamp(14px,2.6vw,24px)] tracking-[0.7em] text-ohc-red">
            MOTORS
          </span>
        </div>
        <div className="mt-10 ub-dots">
          <i />
          <i />
          <i />
        </div>
      </div>
      <button
        type="button"
        aria-label="Pular abertura"
        tabIndex={done ? -1 : 0}
        onClick={() => setDone(true)}
        className="absolute bottom-6 right-6 rounded-sm border border-ohc-line px-3 py-2 text-[12px] tracking-[0.2em] text-ohc-steel uppercase min-h-[44px]"
      >
        Pular
      </button>
    </div>
  );
}
