import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../catalog-drafts/2026-09-29/', import.meta.url));
const { products } = JSON.parse(readFileSync(join(root, 'products.json'), 'utf8'));
const existing = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
assert.equal(products.length, 9);
assert.equal(new Set(products.map(p => p.sku)).size, 9);
assert.equal(readdirSync(join(root, 'images')).length, 9);
for (const p of products) {
  assert.match(p.sku, /^\d\.\d{2}\.[A-Z]\d{2}\.\d{5}$/);
  assert.ok(!existing.some(old => old.sku === p.sku), `SKU existente: ${p.sku}`);
  assert.equal(p.categoria, 'Volantes');
  assert.equal(p.status, 'aguardando_nome');
  for (const field of ['nome_produto', 'marca', 'material', 'recursos', 'compatibilidade', 'preco']) assert.equal(p[field], null);
  for (const field of ['ativo', 'publicado', 'aprovado_administrador', 'plug_and_play_confirmado']) assert.equal(p[field], false);
  assert.equal(p.resultado_externo, 'analise_necessaria');
  assert.equal(p.imagem.arquivo, `images/${p.sku}.png`);
  const bytes = readFileSync(join(root, p.imagem.arquivo));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), p.imagem.largura);
  assert.equal(bytes.readUInt32BE(20), p.imagem.altura);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), p.imagem.sha256);
}
console.log('9 rascunhos validados: SKUs únicos, fotos íntegras, nomes pendentes e publicação desativada.');
