const _cloneDeep = require('lodash/cloneDeep');

function sanitizeUserForClient (user) {
  user = _cloneDeep(user);

  delete user.password;
  delete user.verifyExpires;
  delete user.verifyToken;
  delete user.verifyShortToken;
  delete user.verifyChanges;
  delete user.resetExpires;
  delete user.resetToken;
  delete user.resetShortToken;

  return user;
}

exports.sanitizeUserForClient = sanitizeUserForClient;

function makeNotifier(app) {
  function getLink(action, hash) {
    const url = new URL('http://localhost:3030/');
    url.pathname = '/authmgmt.html';
    url.searchParams.append('action', action);
    url.searchParams.append('token', hash);
    return url.toString();
  }

  async function sendEmail(email) {
    return await app.service('mailer').create(email).then(function (result) {
      console.log('Sent email', result);
    }).catch(err => {
      console.log('Error sending email', err);
    });
  }

  // eslint-disable-next-line no-unused-vars
  return async function(type, user, notifierOptions) {
    if (type === 'resendVerifySignup') {
      const tokenLink = getLink('verify', user.verifyToken);
      return await sendEmail({
        to: user.email,
        subject: 'Verify Signup',
        html: tokenLink
      });
    } else if (type === 'verifySignup') {
      const tokenLink = getLink('verify', user.verifyToken);
      return await sendEmail({
        to: user.email,
        subject: 'Confirm Signup',
        html: tokenLink
      });
    } else if (type === 'sendResetPwd') {
      const tokenLink = getLink('reset', user.resetToken);
      return await sendEmail({
        to: user.email,
        subject: 'Send Reset Password',
        html: tokenLink
      });
    } else if (type === 'resetPwd') {
      const tokenLink = getLink('reset', user.resetToken);
      return await sendEmail({
        to: user.email,
        subject: 'Reset Password',
        html: tokenLink
      });
    } else if (type === 'passwordChange') {
      return await sendEmail({});
    } else if (type === 'identityChange') {
      const tokenLink = getLink('verifyChanges', user.verifyToken);
      return await sendEmail({
        to: user.email,
        subject: 'Change your identity',
        html: tokenLink
      });
    }
  };
}

exports.makeNotifier = makeNotifier;
