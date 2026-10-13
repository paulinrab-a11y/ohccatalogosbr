import assert from 'node:assert/strict';
import { test } from 'node:test';
import { carCatalogHref, carLabel, parseCar } from '../src/lib/myCar';

test('a remembered car is parsed only when it has a sane brand and model', () => {
  assert.deepEqual(parseCar('{"brand":" BMW ","model":"F30 "}'), { brand: 'BMW', model: 'F30' });
  assert.deepEqual(parseCar('{"brand":"Audi"}'), { brand: 'Audi', model: '' });
  for (const raw of [null, '', 'not json', '{"brand":""}', '{"brand":42}', `{"brand":"${'x'.repeat(61)}"}`, `{"brand":"BMW","model":"${'y'.repeat(61)}"}`]) assert.equal(parseCar(raw), null, String(raw));
});

test('the car opens the catalog filtered by brand with the model as search text', () => {
  assert.equal(carCatalogHref({ brand: 'Mercedes-Benz', model: 'W205' }), '/catalogo?marca=Mercedes-Benz&q=W205');
  assert.equal(carCatalogHref({ brand: 'Ford', model: '' }), '/catalogo?marca=Ford');
  assert.equal(carLabel({ brand: 'Ford', model: 'Mustang' }), 'Ford Mustang');
  assert.equal(carLabel({ brand: 'Ford', model: '' }), 'Ford');
});
