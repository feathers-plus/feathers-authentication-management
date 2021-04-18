import { assert } from 'chai';
import feathers from '@feathersjs/feathers';
import feathersMemory from 'feathers-memory';
import authLocalMgnt from '../src/index';
import helpers from '../src/helpers';
import authManagementService from '../src/index';
import { User } from '../src/types';

const makeUsersService = options =>
  function (app) {
    Object.assign(options, { multi: true });
    app.use('/users', feathersMemory(options));
  };

const users_Id = [
  { _id: 'a', email: 'a', username: 'john a', sensitiveData: 'some secret' }
];

describe('helpers.js - sanitization', () => {
  it('allows to stringify sanitized user object', () => {
    const user: Partial<User> = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      resetToken: 'aaa'
    };

    //@ts-ignore
    const result1 = helpers.sanitizeUserForClient(user);
    //@ts-ignore
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.doesNotThrow(() => JSON.stringify(result1));
    assert.doesNotThrow(() => JSON.stringify(result2));
  });

  it('throws error when stringifying sanitized object with circular reference', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      resetToken: 'aaa'
    };

    //@ts-ignore
    user.self = user;

    //@ts-ignore
    const result1 = helpers.sanitizeUserForClient(user);
    //@ts-ignore
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.throws(() => JSON.stringify(result1), TypeError);
    assert.throws(() => JSON.stringify(result2), TypeError);
  });

  it('allows to stringify sanitized object with circular reference and custom toJSON()', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      resetToken: 'aaa',
      toJSON: function () {
        return Object.assign({}, this, { self: undefined });
      }
    };

    //@ts-ignore
    user.self = user;

    //@ts-ignore
    const result1 = helpers.sanitizeUserForClient(user);
    //@ts-ignore
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.doesNotThrow(() => JSON.stringify(result1));
    assert.doesNotThrow(() => JSON.stringify(result2));
  });

  it('allows to stringify sanitized object with circular reference and custom toObject()', () => {
    const user = {
      id: 1,
      email: 'test@test.test',
      password: '0000000000',
      resetToken: 'aaa',
      toObject: function () {
        return Object.assign({}, this, { self: undefined });
      }
    };

    //@ts-ignore
    user.self = user;

    //@ts-ignore
    const result1 = helpers.sanitizeUserForClient(user);
    //@ts-ignore
    const result2 = helpers.sanitizeUserForNotifier(user);

    assert.doesNotThrow(() => JSON.stringify(result1));
    assert.doesNotThrow(() => JSON.stringify(result2));
  });

  it('allows for customized sanitize function', async () => {
    const app = feathers();
    app.configure(makeUsersService({ id: '_id' }));
    app.configure(
      authLocalMgnt({
        sanitizeUserForClient: customSanitizeUserForClient
      })
    );
    app.setup();
    const authManagement = app.service('authManagement');

    const usersService = app.service('users');
    await usersService.remove(null);
    await usersService.create(users_Id);

    const result = await authManagement.create({
      action: 'resendVerifySignup',
      value: { email: 'a' }
    });

    assert.isUndefined(result.sensitiveData);
  });
});

function customSanitizeUserForClient (user) {
  const user1 = helpers.sanitizeUserForClient(user);
  delete user1.sensitiveData;
  return user1;
}
