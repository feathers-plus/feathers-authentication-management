---
title: Getting Started
sidebarDepth: 3
---

# Getting Started

![npm](https://img.shields.io/npm/v/feathers-authentication-management)
<!--![GitHub Workflow Status](https://img.shields.io/github/workflow/status/feathersjs-ecosystem/feathers-authentication-management/Node.js%20CI)-->
![npm](https://img.shields.io/npm/dm/feathers-authentication-management)
[![GitHub license](https://img.shields.io/github/license/feathersjs-ecosystem/feathers-authentication-management)](https://github.com/feathersjs-ecosystem/feathers-authentication-management/blob/master/LICENSE)

## About

Sign up verification, forgotten password reset, and other capabilities for local authentication.

This project is built for [FeathersJS](http://feathersjs.com). An open source web framework for building modern real-time applications.

## Features

- Checking that values for fields like username, email, cellphone are unique within `users` items.
- Hooks for adding a new user.
- Send another sign up verification notification, routing through user's selected transport.
- Process a sign up or identity change verification from a URL response.
- Process a sign up or identity change verification using a short token.
- Send a forgotten password reset notification, routing through user's preferred communication transport.
- Process a forgotten password reset from a URL response.
- Process a forgotten password reset using a short token.
- Process password change.
- Process an identity change such as a new email addr, or cellphone.

## Installation

```bash
npm i feathers-authentication-management feathers-mailer
# or
yarn add feathers-authentication-management feathers-mailer
```

## Setup feathers-mailer

See [feathers-mailer](https://github.com/feathersjs-ecosystem/feathers-mailer)

## Getting Started

```js
// src/
const authManagement = require('feathers-authentication-management');
app
  .configure(authentication)
  .configure(authManagement({ options }, { docs }))
```

### Options

- `service: string='/users'`: The path of the service for user items, e.g. `/users` (default) or `/organization`.
- `path: string='authManagement'`: The path to associate with this service`.
  See [Multiple services](#multiple-services) for more information.
- `skipIsVerifiedCheck: boolean=false`: if `false` (default) it is impossible to reset password if email is not verified.
- `sanitizeUserForClient: (user: User) => Partial<User>`: ([default](https://github.com/feathers-plus/feathers-authentication-management/blob/master/src/helpers/sanitize-user-for-client.js)) sanitize the user in the response, if not overwritten **THE USER OBJECT IS IN THE RESPONSE** eg. on a password reset request, to reply with empty object use `sanitizeUserForClient: () => ({})`
- `notifier: (type: string, user: User, notifierOptions) => Promise<void>` returns a Promise.
  - type: type of notification
    - `'resendVerifySignup'` From resendVerifySignup API call
    - `'verifySignup'` From verifySignupLong and verifySignupShort API calls
    - `'verifySignupSetPassword'` From verifySignupSetPasswordLong and verifySignupSetPasswordShort API calls
    - `'sendResetPwd'` From sendResetPwd API call
    - `'resetPwd'` From resetPwdLong and resetPwdShort API calls
    - `'passwordChange'` From passwordChange API call
    - `'identityChange'` From identityChange API call
  - `user`: user's item, minus password.
  - `notifierOptions`: notifierOptions option from resendVerifySignup and sendResetPwd API calls
- `longTokenLen: number=15`: Half the length of the long token. Default is 15, giving 30-char tokens.
- `shortTokenLen: number=6`: Length of short token.
- `shortTokenDigits: boolean=true`: Short token is digits if true, else alphanumeric.
- `delay: number`: Duration for sign up email verification token in ms. Default is 5 days.
- `resetDelay: number`: Duration for password reset token in ms. Default is 2 hours.
- `resetAttempts: number=0`: Amount of times a user can submit an invalid token before the current token gets removed from the database. Default is 0.
- `reuseResetToken: boolean=false`: Use the same reset token if the user resets password twice in a short period. In this case token is not hashed in the database. Default is false.
- `identifyUserProps: string[]`: Prop names in `user` item which uniquely identify the user,
  e.g. `['username', 'email', 'cellphone']`.
  The default is `['email']`.
  The prop values must be strings.
  Only these props may be changed with verification by the service.
  At least one of these props must be provided whenever a short token is used,
  as the short token alone is too susceptible to brute force attack.

`docs` (optional) are:

- representation of the service swagger documentation. Default `{}`
  See [Docs](#docs) for more information.

### Create notifier function

```js
// src/services/auth-management/notifier.js

module.exports = function(app) {
  function getLink(type, hash) {
    const url = 'http://localhost:3030/' + type + '?token=' + hash; // your domain url
    return url;
  }

  function sendEmail(email) {
    return app.service('mailer').create(email).then(function (result) {
      console.log('Sent email', result)
    }).catch(err => {
      console.log('Error sending email', err)
    })
  }

  return {
    // see options.notifier
    notifier: function(type, user, notifierOptions) {
      let tokenLink
      let email
      switch (type) {
        case 'resendVerifySignup': //sending the user the verification email
          tokenLink = getLink('verify', user.verifyToken)
          email = {
             from: process.env.FROM_EMAIL,
             to: user.email,
             subject: 'Verify Signup',
             html: tokenLink
          }
          return sendEmail(email)
          break

        case 'verifySignup': // confirming verification
          tokenLink = getLink('verify', user.verifyToken)
          email = {
             from: process.env.FROM_EMAIL,
             to: user.email,
             subject: 'Confirm Signup',
             html: 'Thanks for verifying your email'
          }
          return sendEmail(email)
          break

        case 'sendResetPwd':
          tokenLink = getLink('reset', user.resetToken)
          email = {}
          return sendEmail(email)
          break

        case 'resetPwd':
          tokenLink = getLink('reset', user.resetToken)
          email = {}
          return sendEmail(email)
          break

        case 'passwordChange':
          email = {}
          return sendEmail(email)
          break

        case 'identityChange':
          tokenLink = getLink('verifyChanges', user.verifyToken)
          email = {}
          return sendEmail(email)
          break

        default:
          break
      }
    }
  }
}
```

- The getLink function which generates our token url. This can either have a verify token or a reset token included. For now, we are only using the verify token.
- The sendEmail function which calls our /mailer service internally to send the email.
- The notifier function which, based on the action type, decides what email to send where. We are now only using the verification part but this can also be used to code the other actions. Also, we will only be sending the plain link to the email. If you want to use html templates or some preprocessor to generate nicer looking emails, you need to make sure they are inserted as a value in the html key in the email object.



### Add properties to your `/users` service

The service creates and maintains the following properties in the `user` item:

- `isVerified: boolean`: If the user's email addr has been verified
- `verifyToken: string`: The 30-char token generated for email addr verification
- `verifyShortToken: string`: The 6-digit token generated for cellphone addr verification
- `verifyExpires: Date|number`: When the email addr token expire
- `verifyChanges: string[]`: New values to apply on verification to some identifyUserProps
- `resetToken: string`: The 30-char token generated for forgotten password reset
- `resetShortToken: string`: The 6-digit token generated for forgotten password reset
- `resetExpires: Date|number`: When the forgotten password token expire
- `resetAttempts: number`: Amount of incorrect reset submissions left before token invalidation

The following user item might also contain the following props:

- `preferredComm`: The preferred way to notify the user. One of `options.identifyUserProps`.

The `/users` service is expected to be already configured.
Its `patch` method is used to update the password when needed,
and this module hashes the password before it is passed to `patch`,
therefore `patch` may _not_ have a `auth.hashPassword()` hook. In cases where you only need hashPassword for externally submitted patch calls, you may use `iff(isProvider('external'), hashPassword())` on the patch hook.

The user must be signed in before being allowed to change their password or communication values.
The service, for feathers-authenticate v1.x, requires hooks similar to:

```javascript
const { authenticate } = require("@feathersjs/authentication").hooks;

const isAction = (...args) => (hook) => args.includes(hook.data.action);
app.service("authManagement").before({
  create: [
    hooks.iff(
      isAction("passwordChange", "identityChange"),
      authenticate("jwt")
    ),
  ],
});
```

## Testing

`npm test`

## Help

Open an issue or come talk on the FeathersJS Slack.

## License

Licensed under the [MIT license](LICENSE).