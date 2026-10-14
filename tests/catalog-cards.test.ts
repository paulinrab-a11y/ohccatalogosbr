import assert from 'node:assert/strict';
import { test } from 'node:test';
import { byCategoryThenName, fitmentLine, type Product } from '../src/lib/products.ts';

test('the card fitment line is short, joins years and hides "under review"', () => {
 assert.equal(fitmentLine({ application: 'B9', years: null }), 'B9');
 assert.equal(fitmentLine({ application: 'F15/F16/F20/F21/F22', years: '2015–2020' }), 'F15/F16/F20 +2 · 2015–2020');
 assert.equal(fitmentLine({ application: 'Aplicação sob análise', years: null }), '');
 assert.equal(fitmentLine({ application: 'Aplicação sob análise', years: '2018–2022' }), '2018–2022');
});

test('inside a brand, wheels come first and names follow natural order', () => {
 const p = (name: string, category: string) => ({ name, category }) as Product;
 const list = [p('Paddle Shift Audi R8', 'Acessórios'), p('Audi R8 - Couro', 'Volantes'), p('Grade X', 'Grades'), p('Audi B9 - Couro', 'Volantes'), p('Sem categoria', 'Outros')];
 assert.deepEqual(list.sort(byCategoryThenName).map((x) => x.name), ['Audi B9 - Couro', 'Audi R8 - Couro', 'Grade X', 'Paddle Shift Audi R8', 'Sem categoria']);
});
