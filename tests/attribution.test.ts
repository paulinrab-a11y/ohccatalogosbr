import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRef, productMessage, refTag } from '../src/lib/attribution.ts';

test('only campaign parameters create a reference, as short slugs', () => {
 assert.equal(parseRef(new URLSearchParams('marca=BMW')), null);
 assert.deepEqual(parseRef(new URLSearchParams('utm_source=Meta&utm_campaign=Volantes BMW – Outubro')), { source: 'meta', campaign: 'volantes-bmw-outubro', ad: false });
 assert.deepEqual(parseRef(new URLSearchParams('fbclid=abc')), { source: '', campaign: '', ad: true });
});

test('the reference reads like (ref: meta-campanha) and is empty without a campaign', () => {
 assert.equal(refTag(null), '');
 assert.equal(refTag({ source: 'meta', campaign: 'volantes-bmw', ad: true }), ' (ref: meta-volantes-bmw)');
 assert.equal(refTag({ source: '', campaign: 'volantes-bmw', ad: true }), ' (ref: meta-volantes-bmw)');
 assert.equal(refTag({ source: '', campaign: '', ad: true }), ' (ref: meta)');
});

test('the product message carries name, code, the current PIX price and the reference', () => {
 const p = { name: 'BMW M3 - Carbono', sku: '1.02.B02.00062' };
 assert.equal(productMessage(p, 2700, { source: 'meta', campaign: 'm3', ad: true }).replace(/\s/g, ' '), 'Olá! Tenho interesse no BMW M3 - Carbono (código 1.02.B02.00062), que vi no site por R$ 2.700,00 no PIX. Pode me ajudar? (ref: meta-m3)');
 assert.equal(productMessage(p, null, null), 'Olá! Tenho interesse no BMW M3 - Carbono (código 1.02.B02.00062), que vi no site. Pode me passar o preço?');
});
