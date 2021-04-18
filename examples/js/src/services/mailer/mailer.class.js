const { Service } = require('feathers-mailer');

class Mailer extends Service {
  constructor(transport, defaults) {
    super(transport, defaults);
  }
}

exports.Mailer = Mailer;
