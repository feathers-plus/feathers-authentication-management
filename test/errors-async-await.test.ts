
import { assert } from 'chai';
import errors from '@feathersjs/errors';

describe('errors-async-await.js', () => {
  describe('1 deep', () => {
    describe('call as async function', () => {
      it('successful', async () => {
        try {
          const result = await service('ok');
          assert.equal(result, 'service ok');
        } catch (err) {
          assert(false, `unexpected error: ${err.message}`);
        }
      });

      it('throw', async () => {
        try {
          const result = await service('throw');
          assert.equal(result, 'service ok');
        } catch (err) {
          assert.equal(err.message, 'service throw');
        }
      });
    });

    describe('call expecting Promise', () => {
      it('successful', () => {
        return service('ok')
          .then(result => {
            assert.equal(result, 'service ok');
          })
          .catch(err => {
            assert(false, `unexpected error: ${err.message}`);
          });
      });

      it('throw', () => {
        return service('throw')
          .then(result => {
            assert(false, `unexpectedly succeeded`);
          })
          .catch(err => {
            assert.equal(err.message, 'service throw');
          });
      });
    });
  });

  describe('2 deep', () => {
    describe('call as async function', () => {
      it('successful', async () => {
        try {
          const result = await service('passwordChange', 'ok');
          assert.equal(result, 'passwordChange ok');
        } catch (err) {
          assert(false, `unexpected error: ${err.message}`);
        }
      });

      it('throw', async () => {
        try {
          const result = await service('passwordChange', 'throw');
          assert.equal(result, 'service ok');
        } catch (err) {
          assert.equal(err.message, 'passwordChange throw');
        }
      });
    });

    describe('call expecting Promise', () => {
      it('successful', () => {
        return service('passwordChange', 'ok')
          .then(result => {
            assert.equal(result, 'passwordChange ok');
          })
          .catch(err => {
            assert(false, `unexpected error: ${err.message}`);
          });
      });

      it('throw', () => {
        return service('passwordChange', 'throw')
          .then(result => {
            assert(false, `unexpectedly succeeded`);
          })
          .catch(err => {
            assert.equal(err.message, 'passwordChange throw');
          });
      });
    });
  });

  describe('3 deep', () => {
    describe('call as async function', () => {
      it('successful', async () => {
        try {
          const result = await service('passwordChange', 'ensureValuesAreStrings', 'ok');
          assert.equal(result, 'ensureValuesAreStrings ok');
        } catch (err) {
          assert(false, `unexpected error: ${err.message}`);
        }
      });

      it('throw', async () => {
        try {
          const result = await service('passwordChange', 'ensureValuesAreStrings', 'throw');
          assert.equal(result, 'service ok');
        } catch (err) {
          assert.equal(err.message, 'ensureValuesAreStrings throw');
        }
      });
    });

    describe('call expecting Promise', () => {
      it('successful', () => {
        return service('passwordChange', 'ensureValuesAreStrings', 'ok')
          .then(result => {
            assert.equal(result, 'ensureValuesAreStrings ok');
          })
          .catch(err => {
            assert(false, `unexpected error: ${err.message}`);
          });
      });

      it('throw', () => {
        return service('passwordChange', 'ensureValuesAreStrings', 'throw')
          .then(result => {
            assert(false, `unexpectedly succeeded`);
          })
          .catch(err => {
            assert.equal(err.message, 'ensureValuesAreStrings throw');
          });
      });
    });
  });
});

async function service (action, param1?, param2?) {
  switch (action) {
    case 'ok':
      return 'service ok';
    case 'passwordChange':
      try {
        return await passwordChange(param1, param2);
      } catch (err) {
        return Promise.reject(err);
      }
    case 'throw':
      throw new errors.BadRequest('service throw');
    default:
      throw new errors.BadRequest('service throw default');
  }
}

async function passwordChange (param1, param2) {
  switch (param1) {
    case 'ok':
      return 'passwordChange ok';
    case 'throw':
      throw new errors.BadRequest('passwordChange throw');
    case 'ensureValuesAreStrings':
      return await ensureValuesAreStrings(param2);
    default:
      throw new errors.BadRequest('passwordChange throw default');
  }
}

async function ensureValuesAreStrings (param2) {
  switch (param2) {
    case 'ok':
      return 'ensureValuesAreStrings ok';
    case 'throw':
      throw new errors.BadRequest('ensureValuesAreStrings throw');
    default:
      throw new errors.BadRequest('ensureValuesAreStrings throw default');
  }
}
