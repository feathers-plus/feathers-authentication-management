
import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import bcrypt from 'bcryptjs';
import authLocalMgnt from '../src/index';
import {
  SpyOn,
  authenticationService as authService
} from './helpers';
import { timeoutEachTest, maxTimeAllTests } from './helpers/config';
import { AuthenticationManagementService } from '../src/services';

const now = Date.now();

const makeUsersService = (options) =>
  function (app) {
    Object.assign(options, { multi: true });
    app.use('/users', feathersMemory(options));
  };

const usersId = [
  { id: 'a', email: 'a', username: 'aa', isVerified: false, verifyToken: '000', verifyShortToken: '00099', verifyExpires: now + maxTimeAllTests },
  { id: 'b', email: 'b', username: 'bb', isVerified: false, verifyToken: null, verifyShortToken: null, verifyExpires: null },
  { id: 'c', email: 'c', username: 'cc', isVerified: false, verifyToken: '111', verifyShortToken: '11199', verifyExpires: now - maxTimeAllTests },
  { id: 'd', email: 'd', username: 'dd', isVerified: true, verifyToken: '222', verifyShortToken: '22299', verifyExpires: now - maxTimeAllTests },
  { id: 'e',
    email: 'e',
    username: 'ee',
    isVerified: true,
    verifyToken: '800',
    verifyShortToken: '80099',
    verifyExpires: now + maxTimeAllTests,
    verifyChanges: { cellphone: '800' } }
];

const users_Id = [
  { _id: 'a', email: 'a', username: 'aa', isVerified: false, verifyToken: '000', verifyShortToken: '00099', verifyExpires: now + maxTimeAllTests },
  { _id: 'b', email: 'b', username: 'bb', isVerified: false, verifyToken: null, verifyShortToken: null, verifyExpires: null },
  { _id: 'c', email: 'c', username: 'cc', isVerified: false, verifyToken: '111', verifyShortToken: '11199', verifyExpires: now - maxTimeAllTests },
  { _id: 'd', email: 'd', username: 'dd', isVerified: true, verifyToken: '222', verifyShortToken: '22299', verifyExpires: now - maxTimeAllTests },
  { _id: 'e',
    email: 'e',
    username: 'ee',
    isVerified: true,
    verifyToken: '800',
    verifyShortToken: '80099',
    verifyExpires: now + maxTimeAllTests,
    verifyChanges: { cellphone: '800' } }
];

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`verify-signup-set-password-short.js ${pagination} ${idType}`, function () {
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
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(
            authLocalMgnt({
              identifyUserProps: ['email', 'username']
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('verifies valid token and sets password if not verified', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({ action: 'verifySignupSetPasswordShort',
              value: {
                token: '00099',
                user: { email: db[0].email },
                password
              }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.verifyToken, null, 'verifyToken not null');
            assert.strictEqual(user.verifyShortToken, null, 'verifyShortToken not null');
            assert.strictEqual(user.verifyExpires, null, 'verifyExpires not null');
            assert.deepEqual(user.verifyChanges, {}, 'verifyChanges not empty object');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('verifies valid token and sets password if verifyChanges', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({ action: 'verifySignupSetPasswordShort',
              value: {
                token: '80099',
                user: { email: db[4].email },
                password
              }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.verifyToken, null, 'verifyToken not null');
            assert.strictEqual(user.verifyShortToken, null, 'verifyShortToken not null');
            assert.strictEqual(user.verifyExpires, null, 'verifyExpires not null');
            assert.deepEqual(user.verifyChanges, {}, 'verifyChanges not empty object');
            assert.isOk(bcrypt.compareSync(password, user.password), 'password is not hashed value');

            assert.strictEqual(user.cellphone, '800', 'cellphone wrong');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('user is sanitized', async () => {
          try {
            result = await authLocalMgntService.create({ action: 'verifySignupSetPasswordShort',
              value: {
                token: '00099',
                user: { username: db[0].username },
                password: '123456'
              }
            });

            assert.strictEqual(result.isVerified, true, 'isVerified not true');
            assert.strictEqual(result.verifyToken, undefined, 'verifyToken not undefined');
            assert.strictEqual(result.verifyShortToken, undefined, 'verifyShortToken not undefined');
            assert.strictEqual(result.verifyExpires, undefined, 'verifyExpires not undefined');
            assert.strictEqual(result.verifyChanges, undefined, 'verifyChanges not undefined');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('handles multiple user ident', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '00099',
                user: { email: db[0].email, username: db[0].username },
                password: '123456'
              }
            });

            assert.strictEqual(result.isVerified, true, 'isVerified not true');
            assert.strictEqual(result.verifyToken, undefined, 'verifyToken not undefined');
            assert.strictEqual(result.verifyShortToken, undefined, 'verifyShortToken not undefined');
            assert.strictEqual(result.verifyExpires, undefined, 'verifyExpires not undefined');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('requires user ident', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '00099',
                user: {},
                password
              }
            });

            assert(false, 'unexpectedly succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('throws on non-configured user ident', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '00099',
                //TODO: was this right?
                user: { email: undefined, verifyShortToken: '00099' },
                password
              }
            });

            assert(false, 'unexpectedly succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on unverified user', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '22299',
                user: { email: db[3].email },
                password
              }
            });

            assert(false, 'unexpectedly succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on expired token', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '11199',
                password,
                user: { username: db[2].username }
              }
            });

            assert(false, 'unexpectedly succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on user not found', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '999',
                user: { email: '999' },
                password
              }
            });

            assert(false, 'unexpectedly succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error incorrect token', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: { token: '999', user: { email: db[0].email }, password }
            });

            assert(false, 'unexpectedly succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });
      });

      describe('with notification', () => {
        let spyNotifier;

        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;
        let db;
        let result;

        beforeEach(async () => {
          spyNotifier = SpyOn(notifier);

          app = feathers();
          app.use('/authentication', authService(app));
          app.configure(
            makeUsersService({
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

        it('verifies valid token and sets password', async () => {
          try {
            const password = '123456';
            result = await authLocalMgntService.create({
              action: 'verifySignupSetPasswordShort',
              value: {
                token: '00099',
                user: { email: db[0].email },
                password,
              },
              notifierOptions: { transport: 'sms' },
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.verifyToken, null, 'verifyToken not null');
            assert.strictEqual(user.verifyShortToken, null, 'verifyShortToken not null');
            assert.strictEqual(user.verifyExpires, null, 'verifyExpires not null');
            assert.deepEqual(user.verifyChanges, {}, 'verifyChanges not empty object');
            assert.isOk(bcrypt.compareSync(password, user.password), 'password is not hashed value');

            assert.deepEqual(spyNotifier.result()[0].args, [
              'verifySignupSetPassword',
              Object.assign({}, sanitizeUserForEmail(user)),
              { transport: 'sms' }
            ]);
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
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
