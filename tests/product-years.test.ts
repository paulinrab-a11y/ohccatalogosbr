import assert from 'node:assert/strict';
import { test } from 'node:test';
import { yearRange } from '../src/lib/products';

test('model years read as a range only from the catalog values', () => {
  assert.equal(yearRange(2015, 2020), '2015–2020');
  assert.equal(yearRange(2018, 2018), '2018');
  assert.equal(yearRange(2007, null), 'a partir de 2007');
  assert.equal(yearRange(null, 2013), 'até 2013');
  assert.equal(yearRange(null, null), null);
  assert.equal(yearRange(undefined, undefined), null);
});
