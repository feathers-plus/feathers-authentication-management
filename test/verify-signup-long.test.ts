import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import {SpyOn} from './helpers';
import { timeoutEachTest, maxTimeAllTests } from './helpers/config';
import { UserTestDB, UserTestLocal } from './helpers/types';
import { AuthenticationManagementService } from '../src/services';

const now = Date.now();

const makeUsersService = options =>
  function (app) {
    Object.assign(options, { multi: true });
    app.use('/users', feathersMemory(options));
  };

const usersId: UserTestLocal[] = [
  {
    id: 'a',
    email: 'a',
    isVerified: false,
    verifyToken: '000',
    verifyExpires: now + maxTimeAllTests
  },
  {
    id: 'b',
    email: 'b',
    isVerified: false,
    verifyToken: null,
    verifyExpires: null
  },
  {
    id: 'c',
    email: 'c',
    isVerified: false,
    verifyToken: '111',
    verifyExpires: now - maxTimeAllTests
  },
  {
    id: 'd',
    email: 'd',
    isVerified: true,
    verifyToken: '222',
    verifyExpires: now - maxTimeAllTests
  },
  {
    id: 'e',
    email: 'e',
    isVerified: true,
    verifyToken: '800',
    verifyExpires: now + maxTimeAllTests,
    verifyChanges: { cellphone: '800' }
  }
];

const users_Id: UserTestDB[] = [
  {
    _id: 'a',
    email: 'a',
    isVerified: false,
    verifyToken: '000',
    verifyExpires: now + maxTimeAllTests
  },
  {
    _id: 'b',
    email: 'b',
    isVerified: false,
    verifyToken: null,
    verifyExpires: null
  },
  {
    _id: 'c',
    email: 'c',
    isVerified: false,
    verifyToken: '111',
    verifyExpires: now - maxTimeAllTests
  },
  {
    _id: 'd',
    email: 'd',
    isVerified: true,
    verifyToken: '222',
    verifyExpires: now - maxTimeAllTests
  },
  {
    _id: 'e',
    email: 'e',
    isVerified: true,
    verifyToken: '800',
    verifyExpires: now + maxTimeAllTests,
    verifyChanges: { cellphone: '800' }
  }
];

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`verify-signup-long.js ${pagination} ${idType}`, function () {
      this.timeout(timeoutEachTest);

      describe('basic', () => {
        let app: Application;
        let usersService: Service;
        let authLocalMgntService: AuthenticationManagementService;
        let db;
        let result;

        beforeEach(async () => {
          app = feathers();
          app.configure(
            makeUsersService({
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(authLocalMgnt({}));
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('verifies valid token if not verified', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupLong',
              value: '000'
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

        it('verifies valid token if verifyChanges', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupLong',
              value: '800'
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.verifyToken, null, 'verifyToken not null');
            assert.strictEqual(user.verifyShortToken, null, 'verifyShortToken not null');
            assert.strictEqual(user.verifyExpires, null, 'verifyExpires not null');
            assert.deepEqual(user.verifyChanges, {}, 'verifyChanges not empty object');

            assert.strictEqual(user.cellphone, '800', 'cellphone wrong');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('user is sanitized', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupLong',
              value: '000'
            });
            const user = await usersService.get(result.id || result._id);

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

        it('error on verified user without verifyChange', async () => {
          try {
            result = await authLocalMgntService.create(
              {
                action: 'verifySignupLong',
                value: '222'
              }
            );

            assert(false, 'unexpectedly succeeded');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on expired token', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupLong',
              value: '111'
            });

            assert(false, 'unexpectedly succeeded');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on token not found', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupLong',
              value: '999'
            });

            assert(false, 'unexpectedly succeeded');
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

        it('verifies valid token', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'verifySignupLong',
              value: '000',
              notifierOptions: { transport: 'sms' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.verifyToken, null, 'verifyToken not null');
            assert.strictEqual(user.verifyExpires, null, 'verifyExpires not null');

            assert.deepEqual(spyNotifier.result()[0].args, [
              'verifySignup',
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
