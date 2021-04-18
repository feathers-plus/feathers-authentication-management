
import { assert } from 'chai';
import {
  removeVerification
} from '../src/hooks';

let context;

describe('remove-verification.test.js', () => {
  beforeEach(() => {
    context = {
      type: 'after',
      method: 'create',
      params: { provider: 'socketio' },
      result: {
        email: 'a@a.com',
        password: '0000000000',
        isVerified: true,
        verifyToken: '000',
        verifyExpires: Date.now(),
        verifyChanges: {},
        resetToken: '000',
        resetExpires: Date.now()
      }
    };
  });

  it('works with verified user', () => {
    assert.doesNotThrow(() => { removeVerification()(context); });

    const user = context.result;
    assert.property(user, 'isVerified');
    assert.equal(user.isVerified, true);
    assert.notProperty(user, 'verifyToken');
    assert.notProperty(user, 'verifyExpires');
    assert.notProperty(user, 'resetToken');
    assert.notProperty(user, 'resetExpires');
    assert.notProperty(user, 'verifyChanges');
  });

  it('works with unverified user', () => {
    context.result.isVerified = false;

    assert.doesNotThrow(() => { removeVerification()(context); });

    const user = context.result;
    assert.property(user, 'isVerified');
    assert.equal(user.isVerified, false);
    assert.notProperty(user, 'verifyToken');
    assert.notProperty(user, 'verifyExpires');
    assert.notProperty(user, 'resetToken');
    assert.notProperty(user, 'resetExpires');
    assert.notProperty(user, 'verifyChanges');
  });

  it('works if addVerification not run', () => {
    context.result = {};

    assert.doesNotThrow(() => { removeVerification()(context); });
  });

  it('noop if server initiated', () => {
    context.params.provider = undefined;
    assert.doesNotThrow(() => { removeVerification()(context); });

    const user = context.result;
    assert.property(user, 'isVerified');
    assert.equal(user.isVerified, true);
    assert.property(user, 'verifyToken');
    assert.property(user, 'verifyExpires');
    assert.property(user, 'resetToken');
    assert.property(user, 'resetExpires');
    assert.property(user, 'verifyChanges');
  });

  it('works with multiple verified user', () => {
    context.result = [context.result, context.result];
    assert.doesNotThrow(() => { removeVerification()(context); });

    context.result.forEach(user => {
      assert.property(user, 'isVerified');
      assert.equal(user.isVerified, true);
      assert.notProperty(user, 'verifyToken');
      assert.notProperty(user, 'verifyExpires');
      assert.notProperty(user, 'resetToken');
      assert.notProperty(user, 'resetExpires');
      assert.notProperty(user, 'verifyChanges');
    });
  });

  it('does not throw with damaged hook', () => {
    delete context.result;

    assert.doesNotThrow(() => { removeVerification()(context); });
  });

  it('throws if not after', () => {
    context.type = 'before';

    assert.throws(() => { removeVerification()(context); });
  });
});
