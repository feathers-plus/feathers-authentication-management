import { assert } from 'chai';
import randomDigits from '../src/helpers/random-digits';
import randomBytes from '../src/helpers/random-bytes';

describe('randoms.js', () => {
  describe('randomDigits', () => {
    it('correct length', () => {
      const str = randomDigits(6);
      assert.equal(str.length, 6);
    });

    it('returns different values', () => {
      const str1 = randomDigits(6);
      const str2 = randomDigits(6);

      assert.equal(str1.length, 6);
      assert.equal(str2.length, 6);

      assert.notEqual(str1, str2);
    });
  });

  describe('randomBytes', () => {
    it('correct length', async () => {
      const str = await randomBytes(10);

      assert.equal(str.length, 20);
    });

    it('returns different values', async () => {
      const str1 = await randomBytes(10);
      const str2 = await randomBytes(10);

      assert.equal(str1.length, 20);
      assert.equal(str2.length, 20);
      assert.notEqual(str1, str2);
    });
  });
});
