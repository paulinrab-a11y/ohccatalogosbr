import { useEffect, useRef, useState, type FormEvent } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { Link, useRoute } from "../lib/router";
import { customerClient, useCustomerAuth } from "../lib/customerAuth";
import {
  authError,
  emailValue,
  passwordError,
  verificationCode,
  RECOVERY_MESSAGE,
} from "../lib/customerValidation";

type Mode = "login" | "signup" | "recovery" | "reset" | "confirm" | "profile";
const CONFIRM_EMAIL_KEY = "ohc-customer-confirm-email";
// sessionStorage throws when the browser blocks site data. The e-mail is only a
// convenience for the confirmation form, so failures fall back to typing it.
function readConfirmEmail() {
  try {
    return sessionStorage.getItem(CONFIRM_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}
function writeConfirmEmail(email: string | null) {
  try {
    if (email) sessionStorage.setItem(CONFIRM_EMAIL_KEY, email);
    else sessionStorage.removeItem(CONFIRM_EMAIL_KEY);
  } catch {
    /* storage blocked */
  }
}
export default function Conta() {
  const { route, go } = useRoute();
  const auth = useCustomerAuth();
  const mode: Mode =
    (
      {
        "/conta/criar": "signup",
        "/conta/recuperar": "recovery",
        "/conta/redefinir": "reset",
        "/conta/confirmar": "confirm",
        "/minha-conta": "profile",
      } as Record<string, Mode>
    )[route.path] || "login";
  const linkError = auth.linkError && (mode === "confirm" || mode === "reset");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(readConfirmEmail);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    document.title = "Minha conta | OHC Motors";
    if (auth.loading || auth.unavailable || linkError) return;
    if (mode === "profile" && !auth.user) go("/conta");
    if (
      (mode === "login" || mode === "signup" || mode === "confirm") &&
      auth.user
    )
      go("/minha-conta");
  }, [auth.loading, auth.user, auth.unavailable, linkError, mode, go]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    let email = "";
    let name = "";
    let code = "";
    setError("");
    setNotice("");
    try {
      if (mode !== "reset")
        email = emailValue(String(form.get("email") || confirmEmail));
      if (mode === "confirm")
        code = verificationCode(String(form.get("code") || ""));
      if (mode === "signup") {
        name = String(form.get("name") || "")
          .trim()
          .replace(/\s+/g, " ");
        if (!name || name.length > 120)
          throw new Error("Informe seu nome completo, com até 120 caracteres.");
      }
      if (mode === "signup" || mode === "reset") {
        const problem = passwordError(
          password,
          String(form.get("confirmation") || ""),
        );
        if (problem) throw new Error(problem);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confira os campos.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const client = await customerClient();
      if (mode === "confirm") {
        const result = await client.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });
        if (result.error) throw result.error;
        writeConfirmEmail(null);
        go("/minha-conta");
      } else if (mode === "login") {
        const result = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) throw result.error;
        go("/minha-conta");
      } else if (mode === "signup") {
        const result = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${location.origin}/conta/confirmar`,
          },
        });
        if (result.error) throw result.error;
        if (result.data.session) go("/minha-conta");
        else {
          writeConfirmEmail(email);
          setConfirmEmail(email);
          go("/conta/confirmar");
        }
      } else if (mode === "recovery") {
        const result = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/conta/redefinir`,
        });
        // Provider account errors are deliberately indistinguishable.
        if (
          result.error &&
          (result.error.status === 429 ||
            !result.error.status ||
            result.error.status >= 500)
        )
          throw result.error;
        setDone(true);
        setNotice(
          `${RECOVERY_MESSAGE} Abra o link neste mesmo navegador e dispositivo.`,
        );
      } else if (mode === "reset") {
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        setDone(true);
        setNotice("Senha atualizada com sucesso.");
      }
    } catch (e) {
      setError(authError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function resendConfirmation() {
    if (lock.current || cooldown || !confirmEmail) return;
    lock.current = true;
    setBusy(true);
    setResendBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await (await customerClient()).auth.resend({
        type: "signup",
        email: emailValue(confirmEmail),
        options: { emailRedirectTo: `${location.origin}/conta/confirmar` },
      });
      if (
        result.error &&
        (result.error.status === 429 ||
          !result.error.status ||
          result.error.status >= 500)
      )
        throw result.error;
      setCooldown(60);
      setNotice(
        "Se o cadastro estiver pendente, um novo código foi enviado. Aguarde alguns segundos antes de tentar novamente.",
      );
    } catch (e) {
      setError(authError(e));
    } finally {
      lock.current = false;
      setBusy(false);
      setResendBusy(false);
    }
  }
  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await (await customerClient()).auth.signOut({
        scope: "local",
      });
      if (result.error) throw result.error;
      go("/conta");
    } catch (e) {
      setError(authError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const titles = {
    login: "Entre na sua conta",
    signup: "Crie sua conta",
    recovery: "Recupere seu acesso",
    reset: "Defina sua nova senha",
    confirm: "Confirme seu e-mail",
    profile: "Minha conta",
  };
  const showForm =
    !auth.loading &&
    !auth.unavailable &&
    !linkError &&
    !done &&
    ["login", "signup", "recovery", "reset"].includes(mode) &&
    (mode !== "reset" || !!auth.user);
  return (
    <>
      <Nav />
      <main className="customer-shell wrap">
        <div className="customer-intro">
          <p className="eyebrow">OHC Motors · Sua conta</p>
          <h1>{titles[mode]}</h1>
          <p>Acesse seus dados de cadastro com segurança.</p>
          <Link href="/catalogo" className="customer-back">
            ← Explorar o catálogo
          </Link>
        </div>
        <section className="customer-card" aria-label={titles[mode]}>
          <div className="customer-card-top">
            <img src="/ohc-logo.webp" alt="OHC Motors" width="120" />
            <span>ÁREA DO CLIENTE</span>
          </div>
          {auth.loading && <p role="status">Verificando seu acesso…</p>}
          {auth.unavailable && (
            <p role="alert">
              A área de conta está temporariamente indisponível. Tente novamente
              mais tarde.
            </p>
          )}
          {linkError && (
            <div role="alert">
              <p>
                Este link é inválido, expirou, já foi utilizado ou foi aberto em
                outro navegador. Abra o link no navegador e dispositivo em que
                iniciou a solicitação. Se não funcionar, solicite um novo link.
              </p>
              <a href="/conta/recuperar" className="btn btn-ghost mt-5">
                Recuperar acesso
              </a>
            </div>
          )}
          {!auth.loading &&
            !auth.unavailable &&
            !linkError &&
            mode === "reset" &&
            !auth.user && (
              <p role="alert">
                Abra o link recebido por e-mail para redefinir sua senha.{" "}
                <Link href="/conta/recuperar" className="customer-back">
                  Solicitar novo link
                </Link>
              </p>
            )}
          {!auth.loading &&
            !auth.unavailable &&
            !linkError &&
            mode === "confirm" &&
            !done && (
              <>
                <form
                  onSubmit={submit}
                  className="customer-form"
                  aria-busy={busy}
                >
                  <div className="ub-field">
                    <label htmlFor="customer-confirm-email">
                      E-mail do cadastro
                    </label>
                    <input
                      id="customer-confirm-email"
                      name="email"
                      type="email"
                      value={confirmEmail}
                      onChange={(event) => setConfirmEmail(event.target.value)}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={254}
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="ub-field">
                    <label htmlFor="customer-code">Código de ativação</label>
                    <input
                      id="customer-code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={16}
                      onInput={(e) => {
                        // Keep only digits so a pasted "123 456" still fits.
                        const input = e.currentTarget;
                        input.value = input.value
                          .replace(/\D/g, "")
                          .slice(0, 8);
                      }}
                      required
                      disabled={busy}
                      aria-describedby="customer-code-help"
                    />
                  </div>
                  <p id="customer-code-help" className="text-sm text-ohc-steel">
                    Digite o código de 6 a 8 dígitos recebido por e-mail.
                    Confira também o spam. Se a mensagem trouxer um link, abra-o
                    no navegador em que iniciou o cadastro.
                  </p>
                  <button
                    type="submit"
                    className="btn btn-blue"
                    disabled={busy}
                  >
                    {busy ? "VALIDANDO…" : "CONFIRMAR E-MAIL"}
                  </button>
                </form>
                <button
                  type="button"
                  className="btn btn-ghost mt-5"
                  onClick={resendConfirmation}
                  disabled={busy || cooldown > 0 || !confirmEmail}
                >
                  {resendBusy
                    ? "ENVIANDO…"
                    : cooldown > 0
                      ? `Reenviar em ${cooldown}s`
                      : "REENVIAR CÓDIGO"}
                </button>
              </>
            )}
          {showForm && (
            <form onSubmit={submit} className="customer-form" aria-busy={busy}>
              {mode === "signup" && (
                <div className="ub-field">
                  <label htmlFor="customer-name">Nome completo</label>
                  <input
                    id="customer-name"
                    name="name"
                    autoComplete="name"
                    maxLength={120}
                    required
                    disabled={busy}
                  />
                </div>
              )}
              {mode !== "reset" && (
                <div className="ub-field">
                  <label htmlFor="customer-email">E-mail</label>
                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    required
                    disabled={busy}
                  />
                </div>
              )}
              {mode !== "recovery" && (
                <div className="ub-field">
                  <label htmlFor="customer-password">
                    {mode === "reset" ? "Nova senha" : "Senha"}
                  </label>
                  <input
                    id="customer-password"
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    maxLength={128}
                    disabled={busy}
                    aria-describedby={
                      mode === "login" ? undefined : "password-help"
                    }
                  />
                </div>
              )}
              {(mode === "signup" || mode === "reset") && (
                <>
                  <p id="password-help" className="text-sm text-ohc-steel">
                    Use de 12 a 128 caracteres. Prefira uma frase longa e única.
                  </p>
                  <div className="ub-field">
                    <label htmlFor="customer-confirmation">
                      Confirmar senha
                    </label>
                    <input
                      id="customer-confirmation"
                      name="confirmation"
                      type="password"
                      autoComplete="new-password"
                      required
                      maxLength={128}
                      disabled={busy}
                    />
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-blue" disabled={busy}>
                {busy
                  ? "Aguarde…"
                  : (
                      {
                        login: "ENTRAR",
                        signup: "CRIAR CONTA",
                        recovery: "ENVIAR INSTRUÇÕES",
                        reset: "SALVAR NOVA SENHA",
                      } as Record<string, string>
                    )[mode]}
              </button>
            </form>
          )}
          {!auth.loading &&
            !auth.unavailable &&
            !linkError &&
            mode === "profile" &&
            auth.user && (
              <div className="customer-profile">
                <h2>Seus dados</h2>
                <dl>
                  <dt>Nome</dt>
                  <dd>
                    {typeof auth.user.user_metadata.full_name === "string"
                      ? auth.user.user_metadata.full_name.slice(0, 120)
                      : "Não informado"}
                  </dd>
                  <dt>E-mail</dt>
                  <dd>{auth.user.email}</dd>
                  <dt>Status</dt>
                  <dd>
                    {auth.user.email_confirmed_at
                      ? "E-mail confirmado"
                      : "Confirmação pendente"}
                  </dd>
                </dl>
                <button
                  type="button"
                  onClick={logout}
                  disabled={busy}
                  className="btn btn-ghost"
                >
                  {busy ? "Saindo…" : "Sair da conta"}
                </button>
              </div>
            )}
          {error && (
            <p role="alert" className="customer-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="customer-notice">
              {notice}
            </p>
          )}
          {mode === "reset" && done && (
            <Link href="/minha-conta" className="btn btn-blue mt-5">
              Ir para minha conta
            </Link>
          )}
          {mode === "login" && (
            <div className="customer-links">
              <Link href="/conta/recuperar">Esqueci minha senha</Link>
              <Link href="/conta/confirmar">Confirmar meu e-mail</Link>
              <p>
                Ainda não tem conta?{" "}
                <Link href="/conta/criar">Criar conta</Link>
              </p>
            </div>
          )}
          {["signup", "recovery", "confirm"].includes(mode) && (
            <div className="customer-links">
              <Link href="/conta">Voltar para entrar</Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
