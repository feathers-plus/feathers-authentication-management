const assert = require('assert');
const app = require('../../src/app');

describe('\'mailer\' service', () => {
  it('registered the service', () => {
    const service = app.service('mailer');

    assert.ok(service, 'Registered the service');
  });
});
