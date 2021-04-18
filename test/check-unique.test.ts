import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import { timeoutEachTest } from './helpers/config';
import { AuthenticationManagementService } from '../src/services';

const makeUsersService = options =>
  function (app: Application) {
    app.use('/users', feathersMemory(options));
  };

const usersId = [
  { id: 'a', email: 'a', username: 'john a' },
  { id: 'b', email: 'b', username: 'john b' },
  { id: 'c', email: 'c', username: 'john b' }
];

const users_Id = [
  { _id: 'a', email: 'a', username: 'john a' },
  { _id: 'b', email: 'b', username: 'john b' },
  { _id: 'c', email: 'c', username: 'john b' }
];

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`check-unique.test.js ${pagination} ${idType}`, function () {
      this.timeout(timeoutEachTest);

      describe('standard', () => {
        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;

        beforeEach(async () => {
          app = feathers();
          app.configure(authLocalMgnt());
          app.configure(
            makeUsersService({
              multi: true,
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          await usersService.create(
            clone(idType === '_id' ? users_Id : usersId)
          );
        });

        it('returns a promise', async () => {
          const res = authLocalMgntService
            .create({
              action: 'checkUnique',
              value: { username: 'john a' }
            })
            .then(() => { })
            .catch(() => { });

          assert.isOk(res, 'no promise returned');
          assert.isFunction(res.then, 'not a function');
        });

        it('handles empty query', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: {}
            });
          } catch (err) {
            console.log(err);
            assert(false, `unexpectedly failed: ${err.message}`);
          }
        });

        it('handles empty query returning nothing', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'hjhjhj' }
            });
          } catch (err) {
            console.log(err);
            assert(false, `unexpectedly failed: ${err.message}`);
          }
        });

        it('finds single query on single item', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john a' }
            });

            assert.fail(true, false, 'test unexpectedly succeeded');
          } catch (err) {
            assert.equal(err.message, 'Values already taken.');
            assert.equal(err.errors.username, 'Already taken.');
          }
        });

        it('handles noErrMsg option', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john a' },
              meta: { noErrMsg: true }
            });

            assert.fail(true, false, 'test unexpectedly succeeded');
          } catch (err) {
            assert.equal(err.message, 'Error'); // feathers default for no error message
            assert.equal(err.errors.username, 'Already taken.');
          }
        });

        it('finds single query on multiple items', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john b' }
            });

            assert.fail(true, false, 'test unexpectedly succeeded');
          } catch (err) {
            assert.equal(err.message, 'Values already taken.');
            assert.equal(err.errors.username, 'Already taken.');
          }
        });

        it('finds multiple queries on same item', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john a', email: 'a' }
            });

            assert.fail(true, false, 'test unexpectedly succeeded');
          } catch (err) {
            assert.equal(err.message, 'Values already taken.');
            assert.equal(err.errors.username, 'Already taken.');
          }
        });

        it('finds multiple queries on different item', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john a', email: 'b' }
            });

            assert.fail(true, false, 'test unexpectedly succeeded');
          } catch (err) {
            assert.equal(err.message, 'Values already taken.');
            assert.equal(err.errors.username, 'Already taken.');
          }
        });

        it('ignores null & undefined queries', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: undefined, email: null }
            });
          } catch (err) {
            console.log(err);
            assert.fail(true, false, 'test unexpectedly failed');
          }
        });

        it('ignores current user on single item', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john a' },
              ownId: 'a'
            });
          } catch (err) {
            console.log(err);
            assert.fail(true, false, 'test unexpectedly failed');
          }
        });

        it('cannot ignore current user on multiple items', async () => {
          try {
            await authLocalMgntService.create({
              action: 'checkUnique',
              value: { username: 'john b' },
              ownId: 'b'
            });

            assert.fail(true, false, 'test unexpectedly succeeded');
          } catch (err) {
            assert.equal(err.message, 'Values already taken.');
            assert.equal(err.errors.username, 'Already taken.');
          }
        });
      });
    });
  });
});

// Helpers

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
