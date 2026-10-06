import { useEffect, useState } from "react";
import AmbientLighting from "../components/AmbientLighting";
import { adminAuth } from "../lib/adminApi";
import { Link, useRoute } from "../lib/router";

type Phase = "email" | "sent" | "working";

export default function AdminLogin() {
  const { go } = useRoute();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState<Phase>("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const finishMagicLink = async () => {
      const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
      const access = hash.get("access_token");
      const refresh = hash.get("refresh_token");
      if (!access || !refresh) {
        try {
          await adminAuth.me();
          go("/admin");
        } catch {
          /* login normal */
        }
        return;
      }
      history.replaceState(null, "", "/admin/login");
      setPhase("working");
      setError("");
      try {
        await adminAuth.createSession({
          access_token: access,
          refresh_token: refresh,
          expires_in: Number(hash.get("expires_in")) || 3600,
        });
        history.replaceState(null, "", "/admin/login");
        go("/admin");
      } catch (e: any) {
        history.replaceState(null, "", "/admin/login");
        setPhase("email");
        setError(
          e.message || "Não foi possível validar o acesso administrativo.",
        );
      }
    };
    finishMagicLink();
  }, [go]);

  const requestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setPhase("working");
    try {
      await adminAuth.requestAccess(email);
      setPhase("sent");
      setMessage(
        "Se o e-mail estiver autorizado, você receberá um link de acesso. Se a mensagem trouxer um código de 6 a 8 dígitos, você também pode digitá-lo abaixo.",
      );
    } catch (e: any) {
      setPhase("email");
      setError(e.message || "Não foi possível enviar o acesso.");
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhase("working");
    try {
      await adminAuth.createSession({ email, token });
      go("/admin");
    } catch (e: any) {
      setPhase("sent");
      setError(e.message || "Código inválido ou expirado.");
    }
  };

  return (
    <div className="min-h-screen bg-ohc-bg text-ohc-text">
      <AmbientLighting />
      <main className="relative z-10 grid min-h-screen place-items-center px-5 py-10">
        <section className="w-full max-w-[470px] rounded-2xl border border-ohc-line bg-[#0E1117]/95 p-6 shadow-[0_30px_100px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-ohc-line pb-6">
            <img
              src="/ohc-logo.webp"
              alt="OHC Motors"
              className="h-10 w-auto"
            />
            <span className="rounded-full border border-ohc-blue/40 bg-ohc-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-ohc-glow">
              Admin
            </span>
          </div>
          <div className="pt-7">
            <p className="eyebrow">Área restrita</p>
            <h1 className="mt-2 text-[42px] leading-none sm:text-[52px]">
              Painel OHC Motors
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ohc-steel">
              Acesso somente para administradores autorizados. Não há senha
              fixa: a autenticação é feita pelo e-mail cadastrado no Supabase.
            </p>
          </div>

          <form onSubmit={requestAccess} className="mt-7 grid gap-4">
            <div className="ub-field">
              <label htmlFor="admin-email">E-mail autorizado</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@ohcmotors.com.br"
                disabled={phase === "working"}
              />
            </div>
            <button
              type="submit"
              disabled={phase === "working"}
              className="btn btn-blue w-full disabled:cursor-wait disabled:opacity-60"
            >
              {phase === "working"
                ? "Validando…"
                : phase === "sent"
                  ? "Reenviar acesso"
                  : "Enviar acesso por e-mail"}
            </button>
          </form>

          {(phase === "sent" || token) && (
            <form
              onSubmit={verifyCode}
              className="mt-5 border-t border-ohc-line pt-5"
            >
              <div className="ub-field">
                <label htmlFor="admin-code">
                  Código de acesso, se recebido
                </label>
                <input
                  id="admin-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={16}
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={phase === "working" || token.length < 6}
                className="btn btn-ghost mt-3 w-full disabled:opacity-40"
              >
                Entrar com código
              </button>
            </form>
          )}

          {message && (
            <div className="mt-5 rounded-lg border border-ohc-blue/30 bg-ohc-blue/10 p-4 text-sm leading-relaxed text-[#C9D9FF]">
              {message}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-ohc-red/35 bg-ohc-red/10 p-4 text-sm leading-relaxed text-[#FFD0D2]"
            >
              {error}
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-4 border-t border-ohc-line pt-5 text-xs text-ohc-steel">
            <span>Ambiente administrativo protegido</span>
            <Link
              href="/"
              className="font-semibold text-ohc-text hover:text-white"
            >
              Voltar ao site
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
