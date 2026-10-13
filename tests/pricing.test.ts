import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diaMes, formatBRL, getPrecoVigente, parcela } from '../src/lib/pricing.ts';

const now = new Date('2026-10-20T12:00:00-03:00');

test('without a promotion the PIX price stands alone', () => {
 assert.deepEqual(getPrecoVigente({ price: 3000 }, now), { preco: 3000, precoAntigo: null, emPromocao: false, descontoPercentual: 0, validoAte: null });
 assert.equal(getPrecoVigente({ price: null }, now).preco, null);
 assert.equal(getPrecoVigente({ price: 0, promoPrice: 10 }, now).preco, null);
});

test('an active promotion shows the regular price as "de" and the discount', () => {
 const v = getPrecoVigente({ price: 3000, promoPrice: 2700, promoStart: '2026-10-01T00:00:00-03:00', promoEnd: '2026-10-31T23:59:59-03:00' }, now);
 assert.equal(v.emPromocao, true);
 assert.equal(v.preco, 2700);
 assert.equal(v.precoAntigo, 3000);
 assert.equal(v.descontoPercentual, 10);
 assert.equal(diaMes(v.validoAte!), '31/10');
});

test('expired and future promotions are ignored', () => {
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 2700, promoEnd: '2026-10-19T23:59:59-03:00' }, now).emPromocao, false);
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 2700, promoStart: '2026-10-21T00:00:00-03:00' }, now).emPromocao, false);
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 2700, promoStart: '2026-10-21T00:00:00-03:00' }, now).preco, 3000);
});

test('a "promotional" price equal to or above the regular one is not a promotion', () => {
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 3200 }, now).emPromocao, false);
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 3000 }, now).emPromocao, false);
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 3200 }, now).preco, 3000);
});

test('empty dates leave the promotion open on that side', () => {
 const open = getPrecoVigente({ price: 3000, promoPrice: 2500, promoStart: null, promoEnd: null }, now);
 assert.equal(open.emPromocao, true);
 assert.equal(open.validoAte, null);
 assert.equal(open.descontoPercentual, 17);
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 2500, promoStart: '2026-10-01T00:00:00-03:00' }, now).emPromocao, true);
 assert.equal(getPrecoVigente({ price: 3000, promoPrice: 2500, promoEnd: '2026-12-01T00:00:00-03:00' }, now).emPromocao, true);
});

test('installments come only from a registered card price, rounded up to the cent', () => {
 assert.equal(parcela(3500), 1166.67);
 assert.equal(parcela(3600), 1200);
 assert.equal(parcela(null), null);
 assert.equal(parcela(undefined), null);
 assert.equal(formatBRL(2700).replace(/\s/g, ' '), 'R$ 2.700,00');
});
