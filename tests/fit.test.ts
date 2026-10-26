import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitQuery, shapeFit } from '../server/publicFit.js';
import { fitOf, fitSentence, parseFit } from '../src/lib/fit.ts';
import { carComplete, carLabel, parseCar } from '../src/lib/myCar.ts';
import { productMessage } from '../src/lib/attribution.ts';

test('the fit endpoint accepts a plain car and rejects anything odd', () => {
 assert.deepEqual(fitQuery({ marca: ' BMW ', modelo: '320i  Sport', ano: '2015' }), { p_vehicle_brand: 'BMW', p_vehicle_model: '320i Sport', p_vehicle_year: 2015, p_chassis_platform: null });
 assert.equal(fitQuery({ marca: 'BMW', modelo: '320i', ano: '2015', chassi: 'F30' }).p_chassis_platform, 'F30');
 for (const q of [{}, { marca: 'BMW', modelo: '320i' }, { marca: 'BMW', modelo: '320i', ano: '15' }, { marca: 'BMW', modelo: '320i', ano: '1900' }, { marca: 'BMW', modelo: '<script>', ano: '2015' }, { marca: ['BMW'], modelo: '320i', ano: '2015' }, { marca: 'x'.repeat(61), modelo: '320i', ano: '2015' }])
  assert.throws(() => fitQuery(q as any), (e: any) => e.status === 400, JSON.stringify(q));
});

test('only public fields leave the server; unknown statuses are dropped', () => {
 const out = shapeFit({ matched: true, normalized_input: { inferred_chassis_key: 'f30', brand_key: 'bmw' }, results: [
  { sku: '1.02.B02.00062', status: 'compativel', public_notes: 'ok', installation_conditions: null, rule_id: 'secret', decision_batch_id: 'x' },
  { sku: '1.02.D01.00009', status: 'compativel_com_condicoes', public_notes: null, installation_conditions: 'Codificação' },
  { sku: 'X', status: 'outro' },
 ] });
 assert.deepEqual(out, { chassis: 'F30', matched: true, products: [
  { sku: '1.02.B02.00062', status: 'compativel', notes: 'ok', conditions: null },
  { sku: '1.02.D01.00009', status: 'compativel_com_condicoes', notes: null, conditions: 'Codificação' },
 ] });
 assert.ok(!JSON.stringify(out).includes('secret'));
 assert.deepEqual(shapeFit(null), { chassis: null, matched: false, products: [] });
});

test('the site reads the answer per code; what the base does not know is "confirmar", never "não serve"', () => {
 const fit = parseFit({ chassis: 'F30', products: [{ sku: 'A', status: 'compativel' }, { sku: 'B', status: 'incompativel' }, { sku: 'C', status: 'compativel_com_condicoes', conditions: 'Módulo' }] });
 assert.equal(fitOf(fit, 'A').status, 'serve');
 assert.equal(fitOf(fit, 'B').status, 'nao');
 assert.equal(fitOf(fit, 'C').conditions, 'Módulo');
 assert.equal(fitOf(fit, 'Z').status, 'confirmar');
 assert.equal(fitOf(null, 'A').status, 'confirmar');
});

test('the remembered car keeps a sane year', () => {
 assert.deepEqual(parseCar('{"brand":"BMW","model":"320i","year":2015}'), { brand: 'BMW', model: '320i', year: 2015 });
 assert.deepEqual(parseCar('{"brand":"BMW","model":"320i","year":1800}'), { brand: 'BMW', model: '320i' });
 assert.deepEqual(parseCar('{"brand":"BMW","model":"320i","year":"2015"}'), { brand: 'BMW', model: '320i' });
 assert.equal(carComplete({ brand: 'BMW', model: '320i', year: 2015 }), true);
 assert.equal(carComplete({ brand: 'BMW', model: '320i' }), false);
 assert.equal(carLabel({ brand: 'BMW', model: '320i', year: 2015 }), 'BMW 320i 2015');
});

test('the WhatsApp message carries the car and what the site said about it', () => {
 const car = { brand: 'BMW', model: '320i', year: 2015 };
 const fit = parseFit({ chassis: 'F30', products: [{ sku: '1.02.B02.00062', status: 'compativel' }] });
 const line = fitSentence(car, fit, '1.02.B02.00062');
 assert.equal(line, 'Meu carro: BMW 320i 2015 (chassi F30); pelo site, serve no meu carro.');
 assert.equal(fitSentence(car, fit, 'outro'), 'Meu carro: BMW 320i 2015 (chassi F30); queria confirmar se serve.');
 assert.equal(fitSentence({ brand: 'BMW', model: '320i' }, fit, '1.02.B02.00062'), '');
 const text = productMessage({ name: 'BMW M3 - Carbono', sku: '1.02.B02.00062' }, 1900, null, line).replace(/\s/g, ' ');
 assert.equal(text, 'Olá! Tenho interesse no BMW M3 - Carbono (código 1.02.B02.00062), que vi no site por R$ 1.900,00 no PIX. Meu carro: BMW 320i 2015 (chassi F30); pelo site, serve no meu carro. Pode me ajudar?');
});
