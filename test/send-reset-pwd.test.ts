import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import authService from './helpers/authenticationService';

import { timeoutEachTest, maxTimeAllTests } from './helpers/config';
import {
  makeDateTime as helpersMakeDateTime,
  SpyOn,
  aboutEqualDateTime
} from './helpers';
import { UserTestDB, UserTestLocal } from './helpers/types';
import { AuthenticationManagementService } from '../src/services';

function makeDateTime(options1?) {
  options1 = options1 || {};
  options1.delay = options1.delay || maxTimeAllTests;
  return helpersMakeDateTime(options1);
}

const now = Date.now();
const timeout = timeoutEachTest;

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
    isVerified: true,
    verifyToken: null,
    verifyExpires: null
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
    isVerified: true,
    verifyToken: null,
    verifyExpires: null
  }
];

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`send-reset-pwd.js ${pagination} ${idType}`, function () {
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
          app.configure(authLocalMgnt({}));
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('updates verified user', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user = await usersService.get(result.id || result._id);
            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.isString(user.resetToken, 'resetToken not String');
            assert.equal(user.resetToken.length, 60, 'reset token wrong length');
            assert.equal(user.resetShortToken.length, 60, 'reset short token wrong length');
            assert.match(user.resetShortToken, /^\$2[ayb]\$.{56}$/);
            aboutEqualDateTime(user.resetExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('error on unverified user', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'a' }
            });

            assert(false, 'unexpected succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('error on email not found', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'x' }
            });

            assert(false, 'unexpected succeeded.');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('user is sanitized', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });

            assert.strictEqual(result.isVerified, true, 'isVerified not true');
            assert.strictEqual(result.resetToken, undefined, 'resetToken not undefined');
            assert.strictEqual(result.resetShortToken, undefined, 'resetToken not undefined');
            assert.strictEqual(result.resetExpires, undefined, 'resetExpires not undefined');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });
      });

      describe('length can change (digits)', () => {
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
              resetDelay: 200,
              reuseResetToken: true,
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('token is reusable with options.reuseResetToken', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user1 = await usersService.get(result.id || result._id);
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user2 = await usersService.get(result.id || result._id);

            assert.equal(user1.resetToken, user2.resetToken, 'reset token has changed');
            assert.equal(user1.resetShortToken, user2.resetShortToken, 'reset short token has changed');
            assert.equal(user1.resetExpires, user2.resetExpires, 'reset expires wrong has changed');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });

        it('token is not reused after half reset time', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user1 = await usersService.get(result.id || result._id);

            await new Promise(resolve => setTimeout(resolve, 110));
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user2 = await usersService.get(result.id || result._id);

            assert.notEqual(user1.resetToken, user2.resetToken, 'reset token has not changed');
            assert.notEqual(user1.resetShortToken, user2.resetShortToken, 'reset short token has not changed');
            assert.notEqual(user1.resetExpires, user2.resetExpires, 'reset expires wrong has not changed');
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });
      });

      describe('length can change (digits)', () => {
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
              longTokenLen: 10,
              shortTokenLen: 9,
              shortTokenDigits: true
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('updates verified user', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.isString(user.resetToken, 'resetToken not String');
            assert.equal(user.resetToken.length, 60, 'reset token wrong length');
            assert.equal(user.resetShortToken.length, 60, 'reset short token wrong length');
            assert.match(user.resetShortToken, /^\$2[ayb]\$.{56}$/);
            aboutEqualDateTime(user.resetExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
          }
        });
      });

      describe('length can change (alpha)', () => {
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
              longTokenLen: 10,
              shortTokenLen: 9,
              shortTokenDigits: false
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('updates verified user', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.isString(user.resetToken, 'resetToken not String');
            assert.equal(user.resetToken.length, 60, 'reset token wrong length');
            assert.equal(user.resetShortToken.length, 60, 'reset short token wrong length');
            assert.match(user.resetShortToken, /^\$2[ayb]\$.{56}$/);
            aboutEqualDateTime(user.resetExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert(false, 'err code set');
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
              id: idType,
              paginate: pagination === 'paginated'
            })
          );
          app.configure(
            authLocalMgnt({
              longTokenLen: 15,
              shortTokenLen: 6,
              shortTokenDigits: true,
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

        it('is called', async function () {
          try {
            result = await authLocalMgntService.create({
              action: 'sendResetPwd',
              value: { email: 'b' },
              notifierOptions: { transport: 'sms' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.isString(user.resetToken, 'resetToken not String');
            assert.equal(user.resetToken.length, 60, 'reset token wrong length');
            assert.match(user.resetToken, /^\$2[ayb]\$.{56}$/);
            aboutEqualDateTime(user.resetExpires, makeDateTime());

            const expected = spyNotifier.result()[0].args;
            expected[1] = Object.assign({}, expected[1], {
              resetToken: user.resetToken,
              resetShortToken: user.resetShortToken
            });

            assert.deepEqual(expected, ['sendResetPwd', sanitizeUserForEmail(user), { transport: 'sms' }]);
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
  const user1 = clone(user);
  delete user1.password;
  return user1;
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
