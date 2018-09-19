
/* global assert, describe, it */
/* eslint  no-shadow: 0, no-var: 0, one-var: 0, one-var-declaration-per-line: 0,
no-unused-vars: 0 */

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const { saveHash } = require('./../test/helpers/index');
const { hashPassword } = require('../src/helpers')
const authManagementService = require('../src/index');
const SpyOn = require('./helpers/basicSpy');

// user DB

const now = Date.now();
const usersDbPromise = new Promise((resolve, reject) => {

  var app = feathersStubs.app();

  var users = [
    // The added time interval must be longer than it takes to run ALL the tests
    { _id: 'a', email: 'a', isVerified: true, resetToken: 'a___000', resetExpires: now + 200000 },
    { _id: 'b', email: 'b', isVerified: true, resetToken: null, resetExpires: null },
    { _id: 'c', email: 'c', isVerified: true, resetToken: 'c___111', resetExpires: now - 200000 },
    { _id: 'd', email: 'd', isVerified: false, resetToken: 'd___222', resetExpires: now - 200000 },
  ];

  var promises = [];
  
  users.forEach(item => {
    if(item.resetToken) {
      promises.push(
        hashPassword(app, item.resetToken)
          .then(saveHash(item, 'resetToken'))
      );
    }
  });

  Promise.all(promises).then(function() {
    resolve(users);
  });

});

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`resetPwdWithLongToken ${pagination} ${idType}`, function () {
      this.timeout(5000);
      const ifNonPaginated = pagination === 'non-paginated';

      describe('basic', () => {
        var db;
        var app;
        var users;
        var authManagement;
        const password = '123456';

        beforeEach((done) => {
          usersDbPromise.then((usersDb) => {
            db = clone(usersDb);
            app = feathersStubs.app();
            users = feathersStubs.users(app, db, ifNonPaginated, idType);
            authManagementService().call(app); // define and attach authManagement service
            authManagement = app.service('authManagement'); // get handle to authManagement
            done();
          });
        });

        it('verifies valid token', (done) => {
          const resetToken = 'a___000';
          const i = 0;

          authManagement.create({ action: 'resetPwdLong', value: { token: resetToken, password } })
            .then(user => {
              assert.strictEqual(user.isVerified, true, 'user.isVerified not true');
              assert.strictEqual(db[i].isVerified, true, 'isVerified not true');
              assert.strictEqual(db[i].resetToken, null, 'resetToken not null');
              assert.strictEqual(db[i].resetShortToken, null, 'resetShortToken not null');
              assert.strictEqual(db[i].resetExpires, null, 'resetExpires not null');
              assert.isString(db[i].password, 'password not a string');
              assert.equal(db[i].password.length, 60, 'password wrong length');
              done();
            })
            .catch(err => {
              done(err);
            });
        });

        it('user is sanitized', (done) => {
          const resetToken = 'a___000';
          const i = 0;

          authManagement.create({ action: 'resetPwdLong', value: { token: resetToken, password } })
            .then(user => {
              assert.strictEqual(user.isVerified, true, 'isVerified not true');
              assert.strictEqual(user.resetToken, undefined, 'resetToken not undefined');
              assert.strictEqual(user.resetShortToken, undefined, 'resetShortToken not undefined');
              assert.strictEqual(user.resetExpires, undefined, 'resetExpires not undefined');
              assert.isString(db[i].password, 'password not a string');
              assert.equal(db[i].password.length, 60, 'password wrong length');
              done();
            })
            .catch(err => {
              done(err);
            });
        });

        it('error on unverified user', (done) => {
          const resetToken = 'd___222';
          authManagement.create({ action: 'resetPwdLong', value: { token: resetToken, password } }, {},
            (err, user) => {

            })
            .then(user => {
              assert.fail(true, false);
              done();
            })
            .catch(err => {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
              done();
            });
        });

        it('error on expired token', (done) => {
          const resetToken = 'c___111';
          authManagement.create({ action: 'resetPwdLong', value: { token: resetToken, password } })
            .then(user => {
              assert.fail(true, false);
              done();
            })
            .catch(err => {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
              done();
            });
        });

        it('error on token not found', (done) => {
          const resetToken = 'a___999';
          authManagement.create({ action: 'resetPwdLong', value: { token: resetToken, password } })
            .then(user => {
              assert.fail(true, false);
              done();
            })
            .catch(err => {
              assert.isString(err.message);
              assert.isNotFalse(err.message);
              done();
            });
        });
      });

      describe('with notification', () => {
        var db;
        var app;
        var users;
        var spyNotifier;
        var authManagement;
        const password = '123456';

        beforeEach((done) => {
          usersDbPromise.then((usersDb) => {
            db = clone(usersDb);
            app = feathersStubs.app();
            users = feathersStubs.users(app, db, ifNonPaginated, idType);
            spyNotifier = new SpyOn(notifier);

            authManagementService({ notifier: spyNotifier.callWith, testMode: true }).call(app);
            authManagement = app.service('authManagement'); // get handle to authManagement

            done();
          });
        });
  
        it('verifies valid token', (done) => {
          const resetToken = 'a___000';
          const i = 0;
    
          authManagement.create({
            action: 'resetPwdLong',
            value: { token: resetToken, password } }
          )
            .then(user => {
              assert.strictEqual(user.isVerified, true, 'user.isVerified not true');
        
              assert.strictEqual(db[i].isVerified, true, 'isVerified not true');
              assert.strictEqual(db[i].resetToken, null, 'resetToken not null');
              assert.strictEqual(db[i].resetExpires, null, 'resetExpires not null');
        
              const hash = db[i].password;
              assert.isString(hash, 'password not a string');
              assert.equal(hash.length, 60, 'password wrong length');
        
              assert.deepEqual(
                spyNotifier.result()[0].args,
                [
                  'resetPwd',
                  Object.assign({}, sanitizeUserForEmail(db[i])),
                  { passwordField: 'password' }
                ]);
        
              done();
            })
            .catch(err => {
              done(err);
            });
        });
      });
    });
  });
});

// Helpers

function notifier(action, user, notifierOptions, newEmail) {
  return Promise.resolve(user);
}

function sanitizeUserForEmail(user) {
  const user1 = Object.assign({}, user);

  delete user1.password;

  return user1;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
