import { fitQuery, shapeFit } from "../server/publicFit.js";
import { limitRequest, logFailure, serviceRpc } from "../server/runtime.js";

function send(res, status, body, cache = "no-store") {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Método não permitido." });
  }
  try {
    const args = fitQuery(req.query || {});
    await limitRequest(req, "public-fit");
    const result = await serviceRpc("ohc_find_compatibility_memory", args);
    // The answer depends only on the car, so the edge may keep it a while.
    return send(
      res,
      200,
      shapeFit(result),
      "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    );
  } catch (error) {
    const status = Number(error?.status) || 503;
    if (error?.retryAfter)
      res.setHeader("Retry-After", String(error.retryAfter));
    if (status >= 500) logFailure("fit_lookup_failed");
    return send(res, status, {
      error: status < 500 ? error.message : "Consulta indisponível.",
    });
  }
}
