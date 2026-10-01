import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Temporary Preview-only diagnostics: never log environment values.
if (process.env.VERCEL_ENV === 'preview') {
  const url = process.env.OHC_CUSTOMER_SUPABASE_URL || '';
  const key = process.env.OHC_CUSTOMER_PUBLISHABLE_KEY || '';
  let hostValid = false, pathValid = false, protocolValid = false;
  try {
    const parsed = new URL(url);
    hostValid = /^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname);
    pathValid = parsed.pathname === '/' && !parsed.search && !parsed.hash && !parsed.username && !parsed.password;
    protocolValid = parsed.protocol === 'https:';
  } catch {}
  let anon = false;
  try { anon = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch {}
  console.info('customer_config_preflight', JSON.stringify({
    urlPresent: !!url, keyPresent: !!key,
    urlWhitespace: url !== url.trim(), keyWhitespace: key !== key.trim(),
    hostValid, pathValid, protocolValid,
    sameBackend: url === (process.env.SUPABASE_URL || 'https://wlxknhgaoopycrlxygsd.supabase.co'),
    publishableFormat: /^sb_publishable_[A-Za-z0-9_-]+$/.test(key),
    publishableAfterTrim: /^sb_publishable_[A-Za-z0-9_-]+$/.test(key.trim()),
    anon
  }));
}
export default defineConfig({ plugins: [react()], build: { target: 'es2019', chunkSizeWarningLimit: 1200 } });
