import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Nav";
import AmbientLighting from "../components/AmbientLighting";
import Footer, { FloatingWA } from "../components/Footer";
import { useRoute } from "../lib/router";
import { useProducts, waLink } from "../lib/products";
import { applySeo } from "../lib/seo";

const STEPS = [
  ["Informe o carro", "Marca, modelo, ano e, se souber, geração/chassi."],
  ["Envie as fotos", "Frente, traseira/encaixe e comandos do volante atual."],
  [
    "Receba o protocolo",
    "A consulta entra na fila OHC antes de abrir o WhatsApp.",
  ],
];

type PreparedImage = {
  name: string;
  content_type: string;
  size: number;
  data: string;
};
type SubmitResult = {
  protocol?: string;
  public_result?: string;
  photos_expire_at?: string;
  photo_warning?: boolean;
  recommended_products?: Array<{
    sku?: string;
    name?: string | null;
    result_label?: string | null;
  }>;
};

export default function Compatibilidade() {
  const { route } = useRoute();
  const products = useProducts();
  const [interest, setInterest] = useState(route.search.get("sku") || "");
  useEffect(() => {
    applySeo({
      title: "Consultar compatibilidade do volante | OHC Motors",
      description:
        "Descubra se um volante OHC Motors é compatível com seu carro. Informe marca, modelo, ano e versão e envie fotos para uma análise segura.",
      path: "/compatibilidade",
    });
  }, []);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedSku, setSubmittedSku] = useState("");
  const [success, setSuccess] = useState<SubmitResult | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === submittedSku),
    [products, submittedSku],
  );

  const handleFiles = (selected: FileList | null) => {
    const next = Array.from(selected || []);
    if (next.length > 3) {
      setError("Envie no máximo 3 fotos.");
      return;
    }
    const invalid = next.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 12 * 1024 * 1024,
    );
    if (invalid) {
      setError(
        "Use até 3 fotos JPG, PNG ou WebP. O site otimiza as imagens antes do envio.",
      );
      setFiles([]);
      return;
    }
    setError("");
    setFiles(next);
  };

  // After a submit, move focus to the result so keyboard and screen-reader users
  // land on the error or on the new protocol instead of losing their place.
  const errorBox = useRef<HTMLDivElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const focusError = useRef(false);
  useEffect(() => {
    if (error && focusError.current) errorBox.current?.focus();
    focusError.current = false;
  }, [error]);
  useEffect(() => {
    if (!success?.protocol) return;
    window.scrollTo({ top: 0 });
    successHeading.current?.focus();
  }, [success?.protocol]);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    focusError.current = true;
    setError("");
    setSuccess(null);
    const form = new FormData(e.currentTarget);
    if (!files.length)
      return setError(
        "Envie pelo menos uma foto do volante atual para a análise técnica.",
      );
    if (form.get("consent") !== "yes")
      return setError("Autorize o uso das imagens para realizar a consulta.");
    setLoading(true);
    try {
      const encoded = await Promise.all(files.map(prepareImage));
      const sku = String(form.get("sku") || "").trim();
      const product = products.find((p) => p.sku === sku);
      const notes = [
        product
          ? `Produto de interesse: ${product.name} (SKU ${product.sku})`
          : "",
        String(form.get("obs") || "").trim(),
      ]
        .filter(Boolean)
        .join(" | ");

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_brand: String(form.get("marca") || ""),
          vehicle_model: String(form.get("modelo") || ""),
          vehicle_year: Number(form.get("ano")),
          vehicle_version: String(form.get("versao") || "") || null,
          vehicle_generation: String(form.get("geracao") || "") || null,
          vehicle_chassis_platform: String(form.get("chassi") || "") || null,
          current_steering_notes: notes || null,
          consent_data_images: true,
          files: encoded,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data?.error || "Não foi possível registrar a análise.");
      if (
        typeof data.protocol !== "string" ||
        !data.protocol.startsWith("OHC-")
      )
        throw new Error("O serviço não retornou um protocolo válido.");
      setSubmittedSku(sku);
      setSuccess(data);
    } catch (err) {
      focusError.current = true;
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível registrar a análise.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success?.protocol) {
    const message = `Olá! Enviei uma análise de compatibilidade no site da OHC Motors. Meu protocolo é ${success.protocol}${selectedProduct ? ` e tenho interesse no ${selectedProduct.name} (${selectedProduct.sku}).` : "."}`;
    return (
      <>
        <AmbientLighting />
        <Nav />
        <main className="wrap py-14 md:py-20">
          <section className="mx-auto max-w-[760px] rounded-2xl border border-[#43C981]/30 bg-[#0D1016] p-6 text-center shadow-2xl sm:p-10">
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#43C981]/40 bg-[#43C981]/10 text-2xl text-[#93F1BD]"
              aria-hidden="true"
            >
              ✓
            </div>
            <p className="eyebrow mt-6">Consulta registrada</p>
            <h1
              ref={successHeading}
              tabIndex={-1}
              className="mt-3 text-[clamp(42px,8vw,72px)] outline-none"
            >
              PROTOCOLO CRIADO
            </h1>
            <div className="mx-auto mt-6 max-w-max rounded-xl border border-ohc-blue/30 bg-ohc-blue/10 px-5 py-3 font-mono text-lg font-bold tracking-[.08em] text-[#AFC8FF]">
              {success.protocol}
            </div>
            <p className="mx-auto mt-6 max-w-[58ch] text-sm leading-relaxed text-ohc-steel">
              {success.public_result ||
                "A consulta foi registrada e a equipe OHC Motors poderá revisar os dados técnicos antes de confirmar a aplicação."}
            </p>
            {success.photo_warning && (
              <p role="alert" className="mt-4 text-sm text-amber-300">
                Consulta registrada, mas houve falha no envio das fotos.
                Envie-as pelo WhatsApp junto com este protocolo.
              </p>
            )}
            {success.photos_expire_at && (
              <p className="mt-3 text-xs text-ohc-steel">
                As fotos técnicas são privadas e têm expiração automática.
              </p>
            )}
            <a
              className="ub-wa mt-7"
              href={waLink(message)}
              target="_blank"
              rel="noopener"
            >
              Continuar atendimento no WhatsApp
            </a>
            <p className="mt-4 text-xs text-ohc-steel">
              Guarde o protocolo e envie a mensagem pelo WhatsApp para a equipe
              localizar sua análise.
            </p>
          </section>
        </main>
        <Footer />
        <FloatingWA />
      </>
    );
  }

  return (
    <>
      <AmbientLighting />
      <Nav />
      <div className="wrap py-12 md:py-16">
        <h1 className="max-w-[14ch] text-[clamp(40px,7vw,72px)]">
          Confirme a aplicação antes de comprar
        </h1>
        <p className="mt-4 max-w-[65ch] text-ohc-steel">
          A análise agora é registrada no sistema OHC e recebe um protocolo.
          Depois do envio, você continua o atendimento no WhatsApp com esse
          código.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <div
              key={t}
              className="rounded-lg border border-ohc-line bg-ohc-bg2 p-6"
            >
              <div className="font-display text-[44px] leading-none text-ohc-glow">
                {i + 1}
              </div>
              <h3 className="mt-3 font-body text-base font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-ohc-steel">{d}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-5 mt-14 text-[34px]">Solicitar análise</h2>
        <form className="grid max-w-[760px] gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="marca" label="Marca">
              <input
                id="marca"
                name="marca"
                maxLength={80}
                required
                placeholder="BMW"
              />
            </Field>
            <Field id="modelo" label="Modelo">
              <input
                id="modelo"
                name="modelo"
                maxLength={120}
                required
                placeholder="320i"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ano" label="Ano">
              <input
                id="ano"
                name="ano"
                type="number"
                min="1950"
                max="2100"
                required
                placeholder="2020"
              />
            </Field>
            <Field id="versao" label="Versão">
              <input
                id="versao"
                name="versao"
                maxLength={120}
                placeholder="M Sport, Competition…"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="geracao" label="Geração">
              <input
                id="geracao"
                name="geracao"
                maxLength={120}
                placeholder="G20, F30, W205…"
              />
            </Field>
            <Field id="chassi" label="Chassi / plataforma">
              <input
                id="chassi"
                name="chassi"
                maxLength={120}
                placeholder="Se souber"
              />
            </Field>
          </div>
          <Field id="sku" label="Produto de interesse">
            {/* Controlled: the options arrive after the catalog loads, so a
                defaultValue from ?sku= would be lost on a fresh page load. */}
            <select
              id="sku"
              name="sku"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            >
              <option value="">Ainda não escolhi</option>
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.name} (SKU {p.sku})
                </option>
              ))}
            </select>
          </Field>
          <Field id="obs" label="Observações">
            <textarea
              id="obs"
              name="obs"
              maxLength={750}
              rows={3}
              placeholder="Paddle shift, ACC, comandos, alterações já feitas no carro…"
              className="w-full rounded-md border border-ohc-line bg-ohc-bg2 px-4 py-3 text-[15px]"
            />
          </Field>

          <div className="rounded-xl border border-ohc-line bg-ohc-bg2 p-4">
            <label
              className="text-[11px] font-bold uppercase tracking-[.2em] text-ohc-steel"
              htmlFor="photos"
            >
              Fotos técnicas
            </label>
            <p className="mt-2 text-sm text-ohc-steel">
              Envie de 1 a 3 fotos. O site reduz o tamanho antes de registrar,
              sem alterar o conteúdo técnico da imagem.
            </p>
            <input
              id="photos"
              className="mt-4 block w-full text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            {files.length > 0 && (
              <div className="mt-4 grid gap-2">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex justify-between gap-3 rounded-md border border-ohc-line bg-black/10 px-3 py-2 text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-ohc-steel">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ohc-line bg-white/2 p-4 text-xs leading-relaxed text-ohc-steel">
            <input
              name="consent"
              value="yes"
              type="checkbox"
              required
              className="mt-0.5 accent-ohc-glow"
            />
            <span>
              Autorizo o uso dos dados técnicos e imagens enviados para análise
              de compatibilidade e atendimento pela OHC Motors. As fotos são
              armazenadas de forma privada e seguem o prazo de expiração
              configurado pelo sistema.
            </span>
          </label>

          {error && (
            <div
              ref={errorBox}
              tabIndex={-1}
              role="alert"
              className="rounded-lg border border-ohc-red/35 bg-ohc-red/10 p-4 text-sm text-[#FFD0D2]"
            >
              {error}
            </div>
          )}
          <div>
            <button
              className="btn btn-blue min-w-[220px]"
              type="submit"
              disabled={loading}
            >
              {loading ? "Registrando análise…" : "Enviar para análise"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
      <FloatingWA />
    </>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ub-field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

async function prepareImage(file: File): Promise<PreparedImage> {
  const TARGET = 700 * 1024;
  let blob: Blob = file;
  let contentType = file.type;

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponível.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    let quality = 0.82;
    let compressed = await canvasBlob(canvas, "image/webp", quality);
    while (compressed.size > TARGET && quality > 0.5) {
      quality -= 0.08;
      compressed = await canvasBlob(canvas, "image/webp", quality);
    }
    if (compressed.size < file.size || file.size > TARGET) {
      blob = compressed;
      contentType = "image/webp";
    }
  } catch {
    if (file.size > TARGET)
      throw new Error(
        `Não foi possível otimizar ${file.name}. Tente uma foto menor.`,
      );
  }

  if (blob.size > 820 * 1024)
    throw new Error(`${file.name} ficou grande demais após a otimização.`);
  const dataUrl = await blobToDataUrl(blob);
  return {
    name:
      file.name.replace(/\.[^.]+$/, "") +
      (contentType === "image/webp"
        ? ".webp"
        : file.name.match(/\.[^.]+$/)?.[0] || ""),
    content_type: contentType,
    size: blob.size,
    data: dataUrl.split(",")[1] || "",
  };
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Falha ao otimizar a imagem.")),
      type,
      quality,
    ),
  );
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler a foto."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}
