import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import {
  SpyOn,
  authenticationService as authService
} from './helpers';
import hashPassword from '../src/helpers/hash-password';
import { timeoutEachTest } from './helpers/config';
import { UserTestDB, UserTestLocal } from './helpers/types';
import { AuthenticationManagementService } from '../src/services';

const makeUsersService = options =>
  function (app) {
    app.use('/users', feathersMemory(options));
  };

// users DB
const users_Id: UserTestDB[] = [
  { _id: 'a', email: 'a', plainPassword: 'aa', isVerified: false },
  { _id: 'b', email: 'b', plainPassword: 'bb', isVerified: true }
];

const usersId: UserTestLocal[] = [
  { id: 'a', email: 'a', plainPassword: 'aa', isVerified: false },
  { id: 'b', email: 'b', plainPassword: 'bb', isVerified: true }
];

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`identity-change.js ${pagination} ${idType}`, function () {
      this.timeout(timeoutEachTest);

      describe('standard', () => {
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
          if (!users_Id[0].password) {
            users_Id[0].password = await hashPassword(
              app,
              users_Id[0].plainPassword,
              'password'
            );
            users_Id[1].password = await hashPassword(
              app,
              users_Id[1].plainPassword,
              'password'
            );

            usersId[0].password = users_Id[0].password;
            usersId[1].password = users_Id[1].password;
          }

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('updates verified user', async () => {
          try {
            const userRec = clone(users_Id[1]);

            result = await authLocalMgntService.create({
              action: 'identityChange',
              value: {
                user: { email: userRec.email },
                password: userRec.plainPassword,
                changes: { email: 'b@b' }
              }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'isVerified not true');
            assert.equal(user.email, userRec.email);
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });

        it('updates unverified user', async () => {
          try {
            const userRec = clone(users_Id[0]);

            result = await authLocalMgntService.create({
              action: 'identityChange',
              value: {
                user: { email: userRec.email },
                password: userRec.plainPassword,
                changes: { email: 'a@a' }
              }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              false,
              'isVerified not false'
            );
            assert.equal(user.email, userRec.email);
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });

        it('error on wrong password', async () => {
          try {
            const userRec = clone(users_Id[0]);

            result = await authLocalMgntService.create({
              action: 'identityChange',
              value: {
                user: { email: userRec.email },
                password: 'ghghghg',
                changes: { email: 'a@a' }
              }
            });

            assert(false, 'unexpected succeeded.');
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

        it('updates verified user', async () => {
          try {
            const userRec = clone(users_Id[1]);

            result = await authLocalMgntService.create({
              action: 'identityChange',
              value: {
                user: { email: userRec.email },
                password: userRec.plainPassword,
                changes: { email: 'b@b' }
              },
              notifierOptions: {transport: 'sms'},
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(result.isVerified, true, 'isVerified not true');

            assert.equal(user.email, user.email);
            assert.deepEqual(user.verifyChanges, { email: 'b@b' });

            const spy = spyNotifier.result()[0].args;

            assert.deepEqual(spy, [
              'identityChange',
              Object.assign(
                {},
                sanitizeUserForEmail(result),
                extractProps(
                  user,
                  'verifyExpires',
                  'verifyToken',
                  'verifyShortToken',
                  'verifyChanges'
                )
              ),
              { transport: "sms" },
            ]);

            assert.strictEqual(user.isVerified, true, 'isVerified not false');
            assert.isString(user.verifyToken, 'verifyToken not String');
            assert.equal(
              user.verifyToken.length,
              30,
              'verify token wrong length'
            );
            assert.equal(
              user.verifyShortToken.length,
              6,
              'verify short token wrong length'
            );
            assert.match(user.verifyShortToken, /^[0-9]+$/);
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
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

function extractProps (obj, ...rest) {
  const res = {};
  rest.forEach(key => {
    res[key] = obj[key];
  });
  return res;
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
