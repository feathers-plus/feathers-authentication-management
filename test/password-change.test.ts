import { assert } from 'chai';
import bcrypt from 'bcryptjs';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import { authentication as authConfig } from './helpers/config';

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
  {
    _id: 'a',
    email: 'a',
    plainPassword: 'aa',
    plainNewPassword: 'xx',
    isVerified: false
  },
  {
    _id: 'b',
    email: 'b',
    plainPassword: 'bb',
    plainNewPassword: 'yy',
    isVerified: true
  }
];

const usersId: UserTestLocal[] = [
  {
    id: 'a',
    email: 'a',
    plainPassword: 'aa',
    plainNewPassword: 'xx',
    isVerified: false
  },
  {
    id: 'b',
    email: 'b',
    plainPassword: 'bb',
    plainNewPassword: 'yy',
    isVerified: true
  }
];

// Tests
describe('password-change.js', function () {
  this.timeout(timeoutEachTest);

  describe('bcrypt', function () {
    let app: Application;

    beforeEach(async () => {
      app = feathers();
      app.use('/auth', authService(app, Object.assign({}, {...authConfig, entity: null})));
      app.setup();

      // Ugly but makes test much faster
      if (!users_Id[0].password) {
        users_Id[0].password = await hashPassword(app, users_Id[0].plainPassword, 'password');
        users_Id[0].newPassword = await hashPassword(app, users_Id[0].plainNewPassword, 'password');
        users_Id[1].password = await hashPassword(app, users_Id[1].plainPassword, 'password');
        users_Id[1].newPassword = await hashPassword(app, users_Id[1].plainNewPassword, 'password');

        usersId[0].password = users_Id[0].password;
        usersId[0].newPassword = users_Id[0].newPassword;
        usersId[1].password = users_Id[1].password;
        usersId[1].newPassword = users_Id[1].newPassword;
      }
    });

    it('compare plain passwords to encrypted ones', function () {
      assert.isOk(bcrypt.compareSync(users_Id[0].plainPassword, users_Id[0].password), '_Id [0]');
      assert.isOk(bcrypt.compareSync(users_Id[1].plainPassword, users_Id[1].password), '_Id [1]');

      assert.isOk(bcrypt.compareSync(usersId[0].plainNewPassword, usersId[0].newPassword), 'Id [0]');
      assert.isOk(bcrypt.compareSync(usersId[1].plainNewPassword, usersId[1].newPassword), 'Id [1]');
    });
  });

  ['_id' /* 'id' */].forEach(idType => {
    ['paginated' /* 'non-paginated' */].forEach(pagination => {
      describe(`passwordChange ${pagination} ${idType}`, () => {
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

            usersService = app.service('users');
            await usersService.remove(null);
            db = clone(idType === '_id' ? users_Id : usersId);
            await usersService.create(db);
          });

          it('updates verified user', async () => {
            try {
              const userRec = clone(users_Id[1]);

              result = await authLocalMgntService.create({
                action: 'passwordChange',
                value: {
                  user: {
                    email: userRec.email
                  },
                  oldPassword: userRec.plainPassword,
                  password: userRec.plainNewPassword
                }
              });
              const user = await usersService.get(result.id || result._id);

              assert.strictEqual(result.isVerified, true, 'isVerified not true');
              assert.isOk(bcrypt.compareSync(user.plainNewPassword, user.password), `wrong password [1]`);
            } catch (err) {
              console.log(err);
              assert.strictEqual(err, null, 'err code set');
            }
          });

          it('updates unverified user', async () => {
            try {
              const userRec = clone(users_Id[0]);

              result = await authLocalMgntService.create({
                action: 'passwordChange',
                value: {
                  user: {
                    email: userRec.email
                  },
                  oldPassword: userRec.plainPassword,
                  password: userRec.plainNewPassword
                }
              });
              const user = await usersService.get(result.id || result._id);

              assert.strictEqual(result.isVerified, false, 'isVerified not false');
              assert.isOk(bcrypt.compareSync(user.plainNewPassword, user.password), `[0]`);
            } catch (err) {
              console.log(err);
              assert.strictEqual(err, null, 'err code set');
            }
          });

          it('error on wrong password', async () => {
            try {
              const userRec = clone(users_Id[0]);

              result = await authLocalMgntService.create({
                action: 'passwordChange',
                value: {
                  user: {
                    email: userRec.email
                  },
                  oldPassword: 'fdfgfghghj',
                  password: userRec.plainNewPassword
                }
              });
              const user = await usersService.get(result.id || result._id);

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
                action: 'passwordChange',
                value: {
                  user: {
                    email: userRec.email
                  },
                  oldPassword: userRec.plainPassword,
                  password: userRec.plainNewPassword
                },
                notifierOptions: {transport: 'sms'},
              });
              const user = await usersService.get(result.id || result._id);

              assert.strictEqual(result.isVerified, true, 'isVerified not true');
              assert.isOk(bcrypt.compareSync(user.plainNewPassword, user.password), `[1`);
              assert.deepEqual(spyNotifier.result()[0].args, [
                'passwordChange',
                sanitizeUserForEmail(user),
                {transport: 'sms'}
              ]);
            } catch (err) {
              console.log(err);
              assert.strictEqual(err, null, 'err code set');
            }
          });
        });
      });
    });
  });
});

// Helpers

async function notifier(action, user, notifierOptions, newEmail) {
  return user;
}

function sanitizeUserForEmail(user) {
  const user1 = clone(user);
  delete user1.password;
  return user1;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
