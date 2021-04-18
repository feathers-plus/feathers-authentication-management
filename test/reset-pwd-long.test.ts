import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import authService from './helpers/authenticationService';

import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import { SpyOn } from './helpers';
import { hashPassword } from '../src/helpers';
import { timeoutEachTest, maxTimeAllTests } from './helpers/config';
import { AuthenticationManagementService } from '../src/services';

const now = Date.now();

const makeUsersService = options =>
  function (app) {
    app.use('/users', feathersMemory(options));
  };

const fieldToHash = 'resetToken';
const users_Id = [
  // The added time interval must be longer than it takes to run ALL the tests
  {
    _id: 'a',
    email: 'a',
    isVerified: true,
    resetToken: 'a___000',
    resetExpires: now + maxTimeAllTests
  },
  {
    _id: 'b',
    email: 'b',
    isVerified: true,
    resetToken: null,
    resetExpires: null
  },
  {
    _id: 'c',
    email: 'c',
    isVerified: true,
    resetToken: 'c___111',
    resetExpires: now - maxTimeAllTests
  },
  {
    _id: 'd',
    email: 'd',
    isVerified: false,
    resetToken: 'd___222',
    resetExpires: now - maxTimeAllTests
  }
];

const usersId = [
  // The added time interval must be longer than it takes to run ALL the tests
  {
    id: 'a',
    email: 'a',
    isVerified: true,
    resetToken: '000',
    resetExpires: now + maxTimeAllTests
  },
  {
    id: 'b',
    email: 'b',
    isVerified: true,
    resetToken: null,
    resetExpires: null
  },
  {
    id: 'c',
    email: 'c',
    isVerified: true,
    resetToken: '111',
    resetExpires: now - maxTimeAllTests
  },
  {
    id: 'd',
    email: 'd',
    isVerified: false,
    resetToken: '222',
    resetExpires: now - maxTimeAllTests
  }
];

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`reset-pwd-long.js ${pagination} ${idType}`, function () {
      this.timeout(timeoutEachTest);

      describe('basic', () => {
        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;
        let db;
        let result;

        beforeEach(async () => {
          app = feathers();
          app.use('/authentication', authService(app));
          app.configure(
            makeUsersService({
              multi: true,
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(authLocalMgnt({}));
          app.setup();
          authLocalMgntService = app.service('authManagement');

          // Ugly but makes test much faster
          if (users_Id[0][fieldToHash].length < 15) {
            for (let i = 0, ilen = users_Id.length; i < ilen; i++) {
              if (!users_Id[i][fieldToHash]) continue;
              const hashed = await hashPassword(
                app,
                users_Id[i][fieldToHash],
                'resetToken'
              );
              users_Id[i][fieldToHash] = hashed;
              usersId[i][fieldToHash] = hashed;
            }
          }

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('verifies valid token', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resetPwdLong',
              value: { token: 'a___000', password: '123456' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              true,
              'user.isVerified not true'
            );

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.resetToken, null, 'resetToken not null');
            assert.strictEqual(
              user.resetShortToken,
              null,
              'resetShortToken not null'
            );
            assert.strictEqual(
              user.resetExpires,
              null,
              'resetExpires not null'
            );
            assert.isString(user.password, 'password not a string');
            assert.equal(user.password.length, 60, 'password wrong length');
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });

        it('user is sanitized', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resetPwdLong',
              value: { token: 'a___000', password: '123456' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'isVerified not true');
            assert.strictEqual(
              result.resetToken,
              undefined,
              'resetToken not undefined'
            );
            assert.strictEqual(
              result.resetShortToken,
              undefined,
              'resetShortToken not undefined'
            );
            assert.strictEqual(
              result.resetExpires,
              undefined,
              'resetExpires not undefined'
            );
            assert.isString(user.password, 'password not a string');
            assert.equal(user.password.length, 60, 'password wrong length');
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });

        it('error on unverified user', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resetPwdLong',
              value: { token: 'd___222', password: '123456' }
            });

            assert(false, 'unexpected succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on expired token', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resetPwdLong',
              value: { token: 'c___111', password: '123456' }
            });

            assert(false, 'unexpected succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on token not found', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resetPwdLong',
              value: { token: 'a___999', password: '123456' }
            });

            assert(false, 'unexpected succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });
      });

      describe('with notification', () => {
        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;
        let db;
        let result;
        let spyNotifier;

        beforeEach(async () => {
          spyNotifier = SpyOn(notifier);

          app = feathers();
          app.use('/authentication', authService(app));
          app.configure(
            makeUsersService({
              multi: true,
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(
            authLocalMgnt({
              notifier: spyNotifier.callWith
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('verifies valid token', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resetPwdLong',
              value: { token: 'a___000', password: '123456' },
              notifierOptions: {transport: 'sms'},
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              true,
              'user.isVerified not true'
            );

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.resetToken, null, 'resetToken not null');
            assert.strictEqual(
              user.resetExpires,
              null,
              'resetExpires not null'
            );

            assert.isString(user.password, 'password not a string');
            assert.equal(user.password.length, 60, 'password wrong length');

            assert.deepEqual(spyNotifier.result()[0].args, [
              'resetPwd',
              Object.assign({}, sanitizeUserForEmail(user)),
              {transport: 'sms'}
            ]);
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });

        it('verifies reset with long tokens works with generated tokens', async () => {
          const i = 0;
          await authLocalMgntService.create({ action: 'sendResetPwd', value: { email: db[i].email } });
          await authLocalMgntService.create({ action: 'resetPwdLong',
            value: { token: spyNotifier.result()[0].args[1].resetToken, password: '123456' } });
        });

        it('failed reset is expiring the token', async () => {
          const i = 0;
          await authLocalMgntService.create({ action: 'sendResetPwd', value: { email: db[i].email } });

          try {
            await authLocalMgntService.create({ action: 'resetPwdLong',
              value: {
                token: 'a___999', // invalid token
                password: '123456',
                //user: { email: db[i].email },
              }
            });
          } catch {}

          try {
            await authLocalMgntService.create({ action: 'resetPwdLong',
              value: {
                token: spyNotifier.result()[0].args[1].resetToken,
                password: '123456',
                //user: { email: db[i].email },
              }
            });
            assert(false, 'unexpected succeeded.');
          } catch {}
        });
      });

      describe('with reusable token', () => {
        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;
        let db;
        let spyNotifier;
        let result;

        beforeEach(async () => {
          spyNotifier = SpyOn(notifier);

          app = feathers();
          app.use('/authentication', authService(app));
          app.configure(
            makeUsersService({
              multi: true,
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(
            authLocalMgnt({
              notifier: spyNotifier.callWith,
              reuseResetToken: true
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('verifies reused reset works as expected', async () => {
          const i = 0;
          await authLocalMgntService.create({ action: 'sendResetPwd', value: { email: db[i].email } });
          await authLocalMgntService.create({ action: 'sendResetPwd', value: { email: db[i].email } });
          assert.strictEqual(
            spyNotifier.result()[0].args[1].resetToken,
            spyNotifier.result()[1].args[1].resetToken,
            'resetToken is not the same'
          );

          await authLocalMgntService.create({ action: 'resetPwdLong',
            value: {
              token: spyNotifier.result()[0].args[1].resetToken,
              password: '123456',
              //user: { email: db[i].email },
            }
          });
        });
      });

      describe('not expiring on token error', () => {
        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;
        let db;
        let spyNotifier;
        let result;

        beforeEach(async () => {
          spyNotifier = SpyOn(notifier);

          app = feathers();
          app.use('/authentication', authService(app));
          app.configure(
            makeUsersService({
              multi: true,
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(
            authLocalMgnt({
              notifier: spyNotifier.callWith,
              resetAttempts: 1
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('failed reset not expiring the token', async () => {
          const i = 0;
          await authLocalMgntService.create({ action: 'sendResetPwd', value: { email: db[i].email } });

          try {
            await authLocalMgntService.create({ action: 'resetPwdLong',
              value: {
                token: 'a___999', // invalid token
                password: '123456',
                //user: { email: db[i].email },
              }
            });
          } catch {}

          await authLocalMgntService.create({ action: 'resetPwdLong',
            value: {
              token: spyNotifier.result()[0].args[1].resetToken,
              password: '123456',
              //user: { email: db[i].email },
            }
          });
        });
      });
    });
  });
});

// Helpers

async function notifier (action, user, notifierOptions, newEmail) {
  return user;
}

function sanitizeUserForEmail (user) {
  const user1 = Object.assign({}, user);
  delete user1.password;
  return user1;
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
