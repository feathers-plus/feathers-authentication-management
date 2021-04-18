import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import feathersMemory, { Service } from 'feathers-memory';
import authLocalMgnt from '../src/index';
import {
  SpyOn,
  aboutEqualDateTime,
  makeDateTime
} from './helpers';
import { timeoutEachTest, defaultVerifyDelay } from './helpers/config';
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
    verifyShortToken: '00099',
    verifyExpires: now + 500,
    username: 'Doe'
  },
  {
    id: 'b',
    email: 'b',
    isVerified: true,
    verifyToken: null,
    verifyShortToken: null,
    verifyExpires: null
  },
  {
    id: 'c',
    email: 'c',
    isVerified: true,
    verifyToken: '999',
    verifyShortToken: '99900',
    verifyExpires: null
  } // impossible
];

const users_Id: UserTestDB[] = [
  {
    _id: 'a',
    email: 'a',
    isVerified: false,
    verifyToken: '000',
    verifyShortToken: '00099',
    verifyExpires: now + 500,
    username: 'Doe'
  },
  {
    _id: 'b',
    email: 'b',
    isVerified: true,
    verifyToken: null,
    verifyShortToken: null,
    verifyExpires: null
  },
  {
    _id: 'c',
    email: 'c',
    isVerified: true,
    verifyToken: '999',
    verifyShortToken: '99900',
    verifyExpires: null
  } // impossible
];

['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`resend-verify-signup.test.js ${pagination} ${idType}`, function () {
      this.timeout(timeoutEachTest);

      function basicTest1 (desc, values) {
        describe(desc, () => {
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

          it('authLocalMgnt::create exists', () => {
            assert.isFunction(authLocalMgntService.create);
          });

          it('updates unverified user', async () => {
            try {
              result = await authLocalMgntService.create({
                action: 'resendVerifySignup',
                value: values[0]
              });
              const user = await usersService.get(result.id || result._id);

              assert.strictEqual(
                result.isVerified,
                false,
                'result.isVerified not false'
              );
              assert.strictEqual(
                user.isVerified,
                false,
                'isVerified not false'
              );
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
              aboutEqualDateTime(user.verifyExpires, makeDateTime());
            } catch (err) {
              console.log(err);
              assert.strictEqual(err, null, 'err code set');
            }
          });

          it('sanitizes user', async () => {
            try {
              result = await authLocalMgntService.create({
                action: 'resendVerifySignup',
                value: values[1]
              });

              assert.strictEqual(
                result.isVerified,
                false,
                'isVerified not false'
              );
              assert.strictEqual(
                result.verifyToken,
                undefined,
                'verifyToken not undefined'
              );
              assert.strictEqual(
                result.verifyShortToken,
                undefined,
                'verifyShortToken not undefined'
              );
              assert.strictEqual(
                result.verifyExpires,
                undefined,
                'verifyExpires not undefined'
              );
            } catch (err) {
              console.log(err);
              assert.strictEqual(err, null, 'err code set');
            }
          });

          it('error on verified user', async () => {
            try {
              const result = await authLocalMgntService.create({
                action: 'resendVerifySignup',
                value: values[2]
              });

              assert(false, 'unexpectedly succeeded');
            } catch (err) {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
            }
          });

          it('error on email not found', async () => {
            try {
              const result = await authLocalMgntService.create({
                action: 'resendVerifySignup',
                value: values[3]
              });

              assert(false, 'unexpectedly succeeded');
            } catch (err) {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
            }
          });
        });
      }

      basicTest1('emailOrToken is {email}', [
        { email: 'a' },
        { email: 'a' },
        { email: 'b' },
        { email: 'x' }
      ]);

      basicTest1('emailOrToken is {verifyToken}', [
        { verifyToken: '000' },
        { verifyToken: '000' },
        { verifyToken: '999' },
        { verifyToken: 'xxx' }
      ]);

      basicTest1('emailOrToken is {verifyShortToken}', [
        { verifyShortToken: '00099' },
        { verifyShortToken: '00099' },
        { verifyShortToken: '99900' },
        { verifyShortToken: 'xxx' }
      ]);

      describe('emailOrToken is {verifyToken} can change len', () => {
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
          app.configure(
            authLocalMgnt({
              longTokenLen: 10
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('can change', async () => {
          const verifyToken = '000';

          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: { verifyToken }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              false,
              'user.isVerified not false'
            );
            assert.strictEqual(user.isVerified, false, 'isVerified not false');
            assert.isString(user.verifyToken, 'verifyToken not String');
            assert.equal(
              user.verifyToken.length,
              20,
              'verify token wrong length'
            );
            assert.equal(
              user.verifyShortToken.length,
              6,
              'verify short token wrong length'
            );
            assert.match(user.verifyShortToken, /^[0-9]+$/);
            aboutEqualDateTime(user.verifyExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });
      });

      describe('short token (digit) can change length', () => {
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
          app.configure(
            authLocalMgnt({
              longTokenLen: 15, // need to reset this
              shortTokenLen: 8
            })
          );
          app.setup();
          authLocalMgntService = app.service('authManagement');

          usersService = app.service('users');
          await usersService.remove(null);
          db = clone(idType === '_id' ? users_Id : usersId);
          await usersService.create(db);
        });

        it('can change', async () => {
          const verifyToken = '000';

          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: { verifyToken }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              false,
              'user.isVerified not false'
            );
            assert.strictEqual(user.isVerified, false, 'isVerified not false');
            assert.isString(user.verifyToken, 'verifyToken not String');
            assert.equal(
              user.verifyToken.length,
              30,
              'verify token wrong length'
            );
            assert.equal(
              user.verifyShortToken.length,
              8,
              'verify short token wrong length'
            );
            assert.match(user.verifyShortToken, /^[0-9]+$/);
            aboutEqualDateTime(user.verifyExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });
      });

      describe('short token (alpha) can change length', () => {
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
          app.configure(
            authLocalMgnt({
              longTokenLen: 15, // need to reset this
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

        it('can change', async () => {
          const verifyToken = '000';

          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: { verifyToken }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              false,
              'user.isVerified not false'
            );
            assert.strictEqual(user.isVerified, false, 'isVerified not false');
            assert.isString(user.verifyToken, 'verifyToken not String');
            assert.equal(
              user.verifyToken.length,
              30,
              'verify token wrong length'
            );
            assert.equal(
              user.verifyShortToken.length,
              9,
              'verify short token wrong length'
            );
            assert.notMatch(user.verifyShortToken, /^[0-9]+$/);
            aboutEqualDateTime(user.verifyExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });
      });

      describe('use affirming properties', () => {
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
          app.configure(
            authLocalMgnt({
              longTokenLen: 15, // need to reset this
              shortTokenLen: 6,
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

        it('verifies when correct', async () => {
          const verifyToken = '000';

          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: {
                verifyToken,
                email: 'a'
              }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              false,
              'user.isVerified not false'
            );
            assert.strictEqual(user.isVerified, false, 'isVerified not false');
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
            assert.notMatch(user.verifyShortToken, /^[0-9]+$/);
            aboutEqualDateTime(user.verifyExpires, makeDateTime());
          } catch (err) {
            console.log(err);
            assert.strictEqual(err, null, 'err code set');
          }
        });

        it('fails when incorrect', async () => {
          const verifyToken = '000';

          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: {
                verifyToken,
                email: 'a',
                username: 'Doexxxxxxx'
              }
            });

            assert(false, 'unexpectedly succeeded');
          } catch (err) {
            assert.isString(err.message);
            assert.isNotFalse(err.message);
          }
        });

        it('fails when hacks attempted', async () => {
          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: {
                username: 'Doe'
              }
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
              longTokenLen: 15, // need to reset this
              shortTokenLen: 6, // need to reset this
              shortTokenDigits: true, // need to reset this
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

        it('is called', async () => {
          const email = 'a';

          try {
            result = await authLocalMgntService.create({
              action: 'resendVerifySignup',
              value: { email },
              notifierOptions: { transport: 'email' }
            });
            const user = await usersService.get(result.id || result._id);

            assert.strictEqual(
              result.isVerified,
              false,
              'user.isVerified not false'
            );

            assert.strictEqual(user.isVerified, false, 'isVerified not false');
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
            aboutEqualDateTime(user.verifyExpires, makeDateTime());

            assert.deepEqual(spyNotifier.result()[0].args, [
              'resendVerifySignup',
              sanitizeUserForEmail(user),
              { transport: 'email' }
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
