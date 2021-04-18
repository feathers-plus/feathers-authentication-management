
import { assert } from 'chai';
import feathers, { Application } from '@feathersjs/feathers';
import socketio from "@feathersjs/socketio";
import authManagement from '../src/index';
import helpers from '../src/helpers';

import {
  AuthenticationManagementService,
  IdentityChangeService,
  PasswordChangeService,
  ResendVerifySignupService,
  ResetPwdLongService,
  ResetPwdShortService,
  SendResetPwdService,
  VerifySignupLongService,
  VerifySignupSetPasswordLongService,
  VerifySignupSetPasswordShortService,
  VerifySignupShortService,
  CheckUniqueService
} from '../src';
import {
  AuthenticationManagementConfigureOptions
} from '../src/types';

import "@feathersjs/transport-commons";

const optionsDefault: Omit<AuthenticationManagementConfigureOptions, 'app'> = {
  service: '/users', // need exactly this for test suite
  path: "authManagement",
  notifier: () => Promise.resolve(),
  longTokenLen: 15, // token's length will be twice this
  shortTokenLen: 6,
  shortTokenDigits: true,
  resetDelay: 1000 * 60 * 60 * 2, // 2 hours
  delay: 1000 * 60 * 60 * 24 * 5, // 5 days
  resetAttempts: 0,
  reuseResetToken: false,
  identifyUserProps: ['email'],
  sanitizeUserForClient: helpers.sanitizeUserForClient,
  skipIsVerifiedCheck: false,
  passwordField: "password",
  useSeparateServices: {
    checkUnique: 'authManagement/check-unique',
    identityChange: 'authManagement/identity-change',
    passwordChange: 'authManagement/password-change',
    resendVerifySignup: 'authManagement/resend-verify-signup',
    resetPwdLong: 'authManagement/reset-password-long',
    resetPwdShort: 'authManagement/reset-password-short',
    sendResetPwd: 'authManagement/send-reset-pwd',
    verifySignupLong: 'authManagement/verify-signup-long',
    verifySignupSetPasswordLong: 'authManagement/verify-signup-set-password-long',
    verifySignupSetPasswordShort: 'authManagement/verify-signup-set-password-short',
    verifySignupShort: 'authManagement/verify-signup-short'
  }
};

const userMgntOptions = {
  service: '/users',
  notifier: () => Promise.resolve(),
  shortTokenLen: 8
};

const orgMgntOptions = {
  service: '/organizations',
  path: 'authManagement/org', // *** specify path for this instance of service
  notifier: () => Promise.resolve(),
  shortTokenLen: 10
};

function services () {
  const app = this;
  app.configure(user);
  app.configure(organization);
}

function user () {
  const app = this;

  app.use('/users', {
    async create (data) { return data; }
  });

  const service = app.service('/users');

  service.hooks({
    // @ts-ignore
    before: { create: authManagement.hooks.addVerification() }
  });
}

function organization () {
  const app = this;

  app.use('/organizations', {
    async create (data) { return data; }
  });

  const service = app.service('/organizations');

  service.hooks({
    // @ts-ignore
    before: { create: authManagement.hooks.addVerification('authManagement/org') } // *** which one
  });
}

describe('scaffolding.js', () => {
  describe('can configure 1 service', () => {
    let app: Application;

    beforeEach(() => {
      app = feathers();
      app.configure(socketio());
      app.configure(authManagement(userMgntOptions));
      app.configure(services);
      app.setup();
    });

    it('can create an item', async () => {
      const usersService = app.service('/users');

      const user = await usersService.create({ username: 'John Doe' });
      assert.equal(user.username, 'John Doe');
      assert.equal(user.verifyShortToken.length, 8);
    });

    it('can call service', async () => {
      const authLocalMgntService: AuthenticationManagementService = app.service('authManagement');

      const { options } = authLocalMgntService;

      assert.property(options, 'app');
      assert.property(options, 'notifier');
      delete options.app;
      delete options.notifier;

      const useSeparateServices = {
        checkUnique: 'authManagement/check-unique',
        identityChange: 'authManagement/identity-change',
        passwordChange: 'authManagement/password-change',
        resendVerifySignup: 'authManagement/resend-verify-signup',
        resetPwdLong: 'authManagement/reset-password-long',
        resetPwdShort: 'authManagement/reset-password-short',
        sendResetPwd: 'authManagement/send-reset-pwd',
        verifySignupLong: 'authManagement/verify-signup-long',
        verifySignupSetPasswordLong: 'authManagement/verify-signup-set-password-long',
        verifySignupSetPasswordShort: 'authManagement/verify-signup-set-password-short',
        verifySignupShort: 'authManagement/verify-signup-short'
      }

      const expected = Object.assign({}, optionsDefault, userMgntOptions);
      delete expected.notifier;

      //@ts-expect-error thinks options has options
      assert.deepEqual(options, expected);

      Object.values(useSeparateServices).forEach(path => {
        const service = app.service(path);
        assert.ok(service, `registered service at: '${path}'`);
      });
    });

    it("does not call publish on authManagement", async () => {
      const usersService = app.service('/users');

      const authManagementService = app.service("authManagement")

      assert.ok(authManagementService, "registered the service");

      let calledUserEvent = false;
      let calledAuthMgmtEvent = false;

      app.publish((data, context) => {
        if (context.path === "users") {
          calledUserEvent = true;
        }
        if (context.path === "authManagement") {
          calledAuthMgmtEvent = true;
          throw "it should not get here";
        }
      });

      await usersService.create({ username: 'John Doe' });
      await new Promise(resolve => setTimeout(resolve, 50));
      assert.strictEqual(calledUserEvent, true, "published user data");
      assert.strictEqual(calledAuthMgmtEvent, false, "not published authManagement data");
    });
  });

  describe('can configure 2 services', () => {
    let app: Application;

    beforeEach(() => {
      app = feathers();
      app.configure(authManagement(userMgntOptions));
      app.configure(authManagement(orgMgntOptions));
      app.configure(services);
      app.setup();
    });

    it('can create items', async () => {
      const usersService = app.service('/users');
      const organizationsService = app.service('/organizations');

      // create a user item
      const result = await usersService.create({ username: 'John Doe' });

      assert.equal(result.username, 'John Doe');
      assert.equal(result.verifyShortToken.length, 8);

      // create an organization item
      const result1 = await organizationsService.create({ organization: 'Black Ice' });

      assert.equal(result1.organization, 'Black Ice');
      assert.equal(result1.verifyShortToken.length, 10);
    });

    it('can call services', async () => {
      const authLocalMgntService: AuthenticationManagementService = app.service('authManagement'); // *** the default
      const authMgntOrgService: AuthenticationManagementService = app.service('authManagement/org'); // *** which one

      // call the user instance
      const { options } = authLocalMgntService;

      assert.property(options, 'app');
      assert.property(options, 'notifier');
      delete options.app;
      delete options.notifier;

      const useSeparateServices = {
        checkUnique: 'authManagement/check-unique',
        identityChange: 'authManagement/identity-change',
        passwordChange: 'authManagement/password-change',
        resendVerifySignup: 'authManagement/resend-verify-signup',
        resetPwdLong: 'authManagement/reset-password-long',
        resetPwdShort: 'authManagement/reset-password-short',
        sendResetPwd: 'authManagement/send-reset-pwd',
        verifySignupLong: 'authManagement/verify-signup-long',
        verifySignupSetPasswordLong: 'authManagement/verify-signup-set-password-long',
        verifySignupSetPasswordShort: 'authManagement/verify-signup-set-password-short',
        verifySignupShort: 'authManagement/verify-signup-short'
      }

      const expected = Object.assign({}, optionsDefault, userMgntOptions);
      delete expected.notifier;

      //@ts-expect-error thinks options has options
      assert.deepEqual(options, expected);

      Object.values(useSeparateServices).forEach(path => {
        const service = app.service(path);
        assert.ok(service, `registered service at: '${path}'`);
      });

      // call the organization instance
      const options1 = authMgntOrgService.options;

      assert.property(options1, 'app');
      assert.property(options1, 'notifier');
      delete options1.app;
      delete options1.notifier;

      const useSeparateServicesOrg = {
        checkUnique: 'authManagement/org/check-unique',
        identityChange: 'authManagement/org/identity-change',
        passwordChange: 'authManagement/org/password-change',
        resendVerifySignup: 'authManagement/org/resend-verify-signup',
        resetPwdLong: 'authManagement/org/reset-password-long',
        resetPwdShort: 'authManagement/org/reset-password-short',
        sendResetPwd: 'authManagement/org/send-reset-pwd',
        verifySignupLong: 'authManagement/org/verify-signup-long',
        verifySignupSetPasswordLong: 'authManagement/org/verify-signup-set-password-long',
        verifySignupSetPasswordShort: 'authManagement/org/verify-signup-set-password-short',
        verifySignupShort: 'authManagement/org/verify-signup-short'
      }

      const expected1 = Object.assign({}, optionsDefault, orgMgntOptions, { useSeparateServices: useSeparateServicesOrg });
      delete expected1.notifier;

      //@ts-expect-error thinks options has options
      assert.deepEqual(options1, expected1);

      Object.values(useSeparateServicesOrg).forEach(path => {
        const service = app.service(path);
        assert.ok(service, `registered service at: '${path}'`);
      });
    });
  });

  describe('useSeparateServices', () => {
    const makeApp = (options: Partial<AuthenticationManagementConfigureOptions>) => {
      const app = feathers();
      app.configure(authManagement(options));
      app.configure(services);
      app.setup();
      return app;
    }

    it('can disable all separate services with \'false\'', async () => {
      const app = makeApp({ useSeparateServices: false });
      const authLocalMgntService: AuthenticationManagementService = app.service('authManagement');

      const servicePaths = Object.keys(app.services);
      assert.deepEqual(servicePaths.sort(), ["authManagement", "organizations", "users"].sort(), 'has no other services')
    });

    it('can disable certain services', async () => {
      const app = makeApp({ useSeparateServices: {
        checkUnique: false,
        verifySignupShort: false
      } });

      assert.notOk(app.service("authManagement/check-unique"), "does not have 'checkUnique' service");
      assert.notOk(app.service("authManagement/verify-signup-short"), "does not have 'verifySignupShort' service");
    });

    it('can set custom service paths', async () => {
      const app = makeApp({ useSeparateServices: {
        checkUnique: 'super-custom-service'
      } });

      assert.ok(app.service('super-custom-service'), 'registered on custom path');
    });
  });

  describe('services independently', () => {
    it("can register all services independently at custom routes", () => {
      const app = feathers();
      app.configure(services);
      app.use("am", new AuthenticationManagementService({ app }));
      app.use("am/2", new IdentityChangeService({ app }));
      app.use("am/3", new PasswordChangeService({ app }));
      app.use("am/4", new ResendVerifySignupService({ app }));
      app.use("am/5", new ResetPwdLongService({ app }));
      app.use("am/6", new ResetPwdShortService({ app }));
      app.use("am/7", new SendResetPwdService({ app }));
      app.use("am/8", new VerifySignupLongService({ app }));
      app.use("am/9", new VerifySignupSetPasswordLongService({ app }));
      app.use("am/10", new VerifySignupSetPasswordShortService({ app }));
      app.use("am/11", new VerifySignupShortService({ app }));
      app.use("am/1", new CheckUniqueService({ app }));
      app.setup();

      const servicePaths = Object.keys(app.services);

      const expected = [
        "am", "am/1", "am/2", "am/3", "am/4", "am/5", "am/6", "am/7", "am/8", "am/9", "am/10", "am/11"
      ]

      expected.forEach(path => {
        assert.ok(servicePaths.includes(path), `registered '${path}' correctly`);
      })
    });

    it("fails without options: { app }", () => {
      const app = feathers();
      app.configure(services);
      const classes = [
        AuthenticationManagementService,
        CheckUniqueService,
        IdentityChangeService,
        PasswordChangeService,
        ResendVerifySignupService,
        ResetPwdLongService,
        ResetPwdShortService,
        SendResetPwdService,
        VerifySignupLongService,
        VerifySignupSetPasswordLongService,
        VerifySignupSetPasswordShortService,
        VerifySignupShortService,
      ];

      classes.forEach(Service => {
        //@ts-expect-error
        assert.throws(() => new Service());
      })

      classes.forEach(Service => {
        //@ts-expect-error
        assert.throws(() => new Service({}));
      })
    })
  });
});
