import { readPhrase } from '../src/phrases';

test('Set new alarm', () => {
  const phrase = readPhrase()
  expect(phrase).not.toBe(0);
});
