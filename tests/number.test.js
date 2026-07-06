import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNumericInput } from '../src/shared/lib/number.js';

test('parseNumericInput keeps the fallback when the field is blank', () => {
  assert.equal(parseNumericInput('', 48), 48);
});

test('parseNumericInput reads a valid numeric string', () => {
  assert.equal(parseNumericInput('12', 48), 12);
});
