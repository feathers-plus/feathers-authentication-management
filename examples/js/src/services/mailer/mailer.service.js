// Initializes the `mailer` service on path `/mailer`
const { Mailer } = require('./mailer.class');
const hooks = require('./mailer.hooks');
const nodemailer = require('nodemailer');
// see https://github.com/feathersjs-ecosystem/feathers-mailer

module.exports = async function (app) {
  const account = await nodemailer.createTestAccount(); // internet required

  const transporter = {
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure, // 487 only
    requireTLS: true,
    auth: {
      user: account.user, // generated ethereal user
      pass: account.pass // generated ethereal password
    }
  };


  // Initialize our service with any options it requires
  app.use('/mailer', new Mailer(transporter, { from: account.user }));

  // Get our initialized service so that we can register hooks
  const service = app.service('mailer');

  service.hooks(hooks);

  service.hooks({ after: { create: (context) => {
    console.log(nodemailer.getTestMessageUrl(context.result));
  }}});
};
