const assert = require('assert');
const app = require('../../src/app');

describe('\'auth-management\' service', () => {
  it('registered the service', () => {
    const service = app.service('auth-management');

    assert.ok(service, 'Registered the service');
  });
});
