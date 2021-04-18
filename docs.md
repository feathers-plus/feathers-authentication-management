# feathers-authentication-management

Sign up verification, forgotten password reset, and other capabilities for local authentication.

This repo now works with async/await or Promises.

This repo work with either the v1.0 rewrite of `feathers-authentication` or with v0.7.
The example below uses v1.0.

### Multiple communication channels:

Traditionally users have been authenticated using their `username` or `email`.
However that landscape is changing.

Teens are more involved with cellphone SMS, whatsapp, facebook, QQ and wechat than they are with email.
Seniors may not know how to create an email account or check email, but they have smart phones
and perhaps whatsapp or wechat accounts.

A more flexible design would maintain multiple communication channels for a user
-- username, email address, phone number, handles for whatsapp, facebook, QQ, wechat --
which each uniquely identify the user.
The user could then sign in using any of their unique identifiers.
The user could also indicate how they prefer to be contacted.
Some may prefer to get password resets via long tokens sent by email;
others may prefer short numeric tokens sent by SMS or wechat.

`feathers-authentication` and `feathers-authentication-management`
provide much of the infrastructure necessary to implement such a scenario.

### Capabilities:

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

### User notifications may be sent for:

- Sign up verification when a new user is created.
- Sign up verification and initial password set when a new user is created.
- Resending a signup verification, e.g. previous verification was lost or is expired.
- Successful user verification.
- Resetting the password when the password is forgotten.
- Successful password reset for a forgotten password.
- Manual change of a password.
- Change of identity. Notify both the current and new e.g. old email addr may be notified when the email addr changes.

### May be used with

- `feathers-client` service calls over websockets or HTTP.
- Client side wrappers for `feathers-client` service calls.
- HTTP POST calls.
- React's Redux.
- Vue (docs to do)

Various-sized tokens can be used during the verify/reset processes:

A 30-char token is generated suitable for URL responses.
(Configurable length.)
This may be embedded in URL links sent by email, SMS or social media
so that clicking the link starts the sign up verification or the password reset.

A 6-digit token is also generated suitable for notification by SMS or social media.
(Configurable length, may be alpha-numeric instead.)
This may be manually entered in a UI to start the sign up verification or the password reset.

The email verification token has a 5-day expiry (configurable),
while the password reset has a 2 hour expiry (configurable).

Typically your notifier routine refers to a property like `user.preferredComm: 'email'`
to determine which transport to use for user notification.
However the API allows the UI to be set up to ask the user which transport they prefer for that time.

The server does not handle any interactions with the user.
Leaving it a pure API server, lets it be used with both native and browser clients.

## Contents

- [feathers-authentication-management](#feathers-authentication-management)
    - [Multiple communication channels:](#multiple-communication-channels)
    - [Capabilities:](#capabilities)
    - [User notifications may be sent for:](#user-notifications-may-be-sent-for)
    - [May be used with](#may-be-used-with)
  - [Contents](#contents)
  - [Service](#service)
  - [Client](#client)
    - [Using Feathers method calls](#using-feathers-method-calls)
    - [Provided service wrappers](#provided-service-wrappers)
    - [HTTP fetch](#http-fetch)
    - [React Redux](#react-redux)
      - [Dispatching services](#dispatching-services)
      - [Dispatching authentication](#dispatching-authentication)
    - [Vue](#vue)
  - [Hooks](#hooks)
    - [`verifyHooks.addVerification( path = 'authManagement' )`](#verifyhooksaddverification-path--authmanagement-)
    - [`verifyHooks.isVerified()`](#verifyhooksisverified)
  - [Multiple services](#multiple-services)
  - [Database](#database)
  - [Routing](#routing)
  - [Security](#security)
  - [Docs](#docs)
  - [Configurable](#configurable)
  - [Tests](#tests)

## Service

```javascript
import authManagement from "feathers-authentication-management";
app
  .configure(authentication)
  .configure(authManagement({ options }, { docs }))
  .configure(user);
```

`options` are:

- service: The path of the service for user items, e.g. `/users` (default) or `/organization`.
- path: The path to associate with this service. Default `authManagement`.
  See [Multiple services](#multiple-services) for more information.
- skipIsVerifiedCheck: if `false` (default) it is impossible to reset password if email is not verified.
- sanitizeUserForClient: ([default](https://github.com/feathers-plus/feathers-authentication-management/blob/master/src/helpers/sanitize-user-for-client.js)) sanatize the user in the response, if not overwriten **THE USER OBJECT IS IN THE RESPONSE** eg. on a password reset request, to reply with empty object use `sanitizeUserForClient: () => ({})`
- notifier: `function(type, user, notifierOptions)` returns a Promise.
  - type: type of notification
    - 'resendVerifySignup' From resendVerifySignup API call
    - 'verifySignup' From verifySignupLong and verifySignupShort API calls
    - 'verifySignupSetPassword' From verifySignupSetPasswordLong and verifySignupSetPasswordShort API calls
    - 'sendResetPwd' From sendResetPwd API call
    - 'resetPwd' From resetPwdLong and resetPwdShort API calls
    - 'passwordChange' From passwordChange API call
    - 'identityChange' From identityChange API call
  - user: user's item, minus password.
  - notifierOptions: notifierOptions option from resendVerifySignup and sendResetPwd API calls
- longTokenLen: Half the length of the long token. Default is 15, giving 30-char tokens.
- shortTokenLen: Length of short token. Default is 6.
- shortTokenDigits: Short token is digits if true, else alphanumeric. Default is true.
- delay: Duration for sign up email verification token in ms. Default is 5 days.
- resetDelay: Duration for password reset token in ms. Default is 2 hours.
- resetAttempts: Amount of times a user can submit an invalid token before the current token gets removed from the database. Default is 0.
- reuseResetToken: Use the same reset token if the user resets password twice in a short period. In this case token is not hashed in the database. Default is false.
- identifyUserProps: Prop names in `user` item which uniquely identify the user,
  e.g. `['username', 'email', 'cellphone']`.
  The default is `['email']`.
  The prop values must be strings.
  Only these props may be changed with verification by the service.
  At least one of these props must be provided whenever a short token is used,
  as the short token alone is too susceptible to brute force attack.

`docs` (optional) are:

- representation of the service swagger documentation. Default `{}`
  See [Docs](#docs) for more information.

The service creates and maintains the following properties in the `user` item:

- isVerified: If the user's email addr has been verified (boolean)
- verifyToken: The 30-char token generated for email addr verification (string)
- verifyShortToken: The 6-digit token generated for cellphone addr verification (string)
- verifyExpires: When the email addr token expire (Date)
- verifyChanges New values to apply on verification to some identifyUserProps (string array)
- resetToken: The 30-char token generated for forgotten password reset (string)
- resetShortToken: The 6-digit token generated for forgotten password reset (string)
- resetExpires: When the forgotten password token expire (Date)
- resetAttempts: Amount of incorrect reset submissions left before token invalidation (Number)

The following `user` item might also contain the following props:

- preferredComm The preferred way to notify the user. One of identifyUserProps.

The `users` service is expected to be already configured.
Its `patch` method is used to update the password when needed,
and this module hashes the password before it is passed to `patch`,
therefore `patch` may _not_ have a `auth.hashPassword()` hook. In cases where you only need hashPassword for externally submitted patch calls, you may use `iff(isProvider('external'), hashPassword())` on the patch hook.

The user must be signed in before being allowed to change their password or communication values.
The service, for feathers-authenticate v1.x, requires hooks similar to:

```javascript
const isAction = (...args) => (hook) => args.includes(hook.data.action);
app.service("authManagement").before({
  create: [
    hooks.iff(
      isAction("passwordChange", "identityChange"),
      auth.hooks.authenticate("jwt")
    ),
  ],
});
```

## Client

The service may be called on the client using

- [Using Feathers method calls](#using-feathers-method-calls)
- [Provided service wrappers](#provided-service-wrappers)
- [HTTP fetch](#http-fetch)
- [React's Redux](#react-redux)
- [Vue 2.0 (docs todo)](#vue)

### Using Feathers method calls

Method calls return a Promise.

```javascript
import authManagementService from "feathers-authentication-management";
app.configure(authManagementService(options));
const authManagement = app.service("authManagement");

// check props are unique in the users items
authManagement.create({
  action: "checkUnique",
  value: identifyUser, // e.g. {email, username}. Props with null or undefined are ignored.
  ownId, // excludes your current user from the search
  meta: { noErrMsg }, // if return an error.message if not unique
});
// ownId allows the "current" item to be ignored when checking if a field value is unique amoung users.
// noErrMsg determines if the returned error.message contains text. This may simplify your client side validation.

// resend sign up verification notification
authManagement.create({
  action: "resendVerifySignup",
  value: identifyUser, // {email}, {token: verifyToken}
  notifierOptions: {}, // options passed to options.notifier, e.g. {preferredComm: 'cellphone'}
});

// sign up or identityChange verification with long token
authManagement.create({
  action: "verifySignupLong",
  value: verifyToken, // compares to .verifyToken
});

// sign up or identityChange verification with short token
authManagement.create({
  action: "verifySignupShort",
  value: {
    user, // identify user, e.g. {email: 'a@a.com'}. See options.identifyUserProps.
    token, // compares to .verifyShortToken
  },
});

// sign up verification and set password  with long token
authManagement.create({
  action: "verifySignupSetPasswordLong",
  value: {
    token, // compares to .verifyToken
    password, // new password
  },
});

// sign up verification and set password with short token
authManagement.create({
  action: "verifySignupSetPasswordShort",
  value: {
    user, // identify user, e.g. {email: 'a@a.com'}. See options.identifyUserProps.
    token, // compares to .verifyShortToken
    password, // new password
  },
});

// send forgotten password notification
authManagement.create({
  action: "sendResetPwd",
  value: identifyUser, // {email}, {token: verifyToken}
  notifierOptions, // options passed to options.notifier, e.g. {preferredComm: 'email'}
});

// forgotten password verification with long token
authManagement.create({
  action: "resetPwdLong",
  value: {
    token, // compares to .resetToken
    password, // new password
  },
});

// forgotten password verification with short token
authManagement.create({
  action: "resetPwdShort",
  value: {
    user: identifyUser, // identify user, e.g. {email: 'a@a.com'}. See options.identifyUserProps.
    token, // compares to .resetShortToken
    password, // new password
  },
});

// change password
authManagement.create({
  action: "passwordChange",
  value: {
    user: identifyUser, // identify user, e.g. {email: 'a@a.com'}. See options.identifyUserProps.
    oldPassword, // old password for verification
    password, // new password
  },
});

// change communications
authManagement.create({
  action: "identityChange",
  value: {
    user: identifyUser, // identify user, e.g. {email: 'a@a.com'}. See options.identifyUserProps.
    password, // current password for verification
    changes, // {email: 'a@a.com'} or {email: 'a@a.com', cellphone: '+1-800-555-1212'}
  },
});

// Authenticate user and log on if user is verified.
var cbCalled = false;
app
  .authenticate({ type: "local", email, password })
  .then((result) => {
    const user = result.data;
    if (!user || !user.isVerified) {
      app.logout();
      cb(
        new Error(user ? "User's email is not verified." : "No user returned.")
      );
      return;
    }
    cbCalled = true;
    cb(null, user);
  })
  .catch((err) => {
    if (!cbCalled) {
      cb(err);
    } // ignore throws from .then( cb(null, user) )
  });
```

### Provided service wrappers

The wrappers return a Promise.

```javascript
<script src=".../feathers-authentication-management/lib/client.js"></script>
  or
import AuthManagement from 'feathers-authentication-management/lib/client';
const app = feathers() ...
const authManagement = new AuthManagement(app);

// check props are unique in the users items
authManagement.checkUnique(identifyUser, ownId, ifErrMsg)

// resend sign up verification notification
authManagement.resendVerifySignup(identifyUser, notifierOptions)

// sign up or identityChange verification with long token
authManagement.verifySignupLong(verifyToken)

// sign up or identityChange verification with short token
authManagement.verifySignupShort(verifyShortToken, identifyUser)

// sign up or identityChange verification with long token
authManagement.verifySignupSetPasswordLong(verifyToken, password)

// sign up or identityChange verification with short token
authManagement.verifySignupSetPasswordShort(verifyShortToken, identifyUser, password)

// send forgotten password notification
authManagement.sendResetPwd(identifyUser, notifierOptions)

// forgotten password verification with long token
authManagement.resetPwdLong(resetToken, password)

// forgotten password verification with short token
authManagement.resetPwdShort(resetShortToken, identifyUser, password)

// change password
authManagement.passwordChange(oldPassword, password, identifyUser)

// change identity
authManagement.identityChange(password, changesIdentifyUser, identifyUser)

// Authenticate user and log on if user is verified. v0.x only.
authManagement.authenticate(email, password)
```

### HTTP fetch

```javascript
// check props are unique in the users items
// Set params just like [Feathers method calls.](#methods)
fetch('/authManagement', {
  method: 'POST', headers: { Accept: 'application/json' },
  body: JSON.stringify({ action: 'checkUnique', value: identifyUser, ownId, meta: { noErrMsg } })
})
  .then(data => { ... }).catch(err => { ... });
```

### React Redux

See `feathers-reduxify-services` for information about state, etc.
See `feathers-starter-react-redux-login-roles` for a working example.

#### Dispatching services

```javascript
import feathers from 'feathers-client';
import reduxifyServices from 'feathers-reduxify-services';
const app = feathers().configure(feathers.socketio(socket)).configure(feathers.hooks());
const services = reduxifyServices(app, ['users', 'authManagement', ...]);
...
// hook up Redux reducers
export default combineReducers({
  users: services.users.reducer,
  authManagement: services.authManagement.reducer,
});
...

// email addr verification with long token
// Feathers is now 100% compatible with Redux. Use just like [Feathers method calls.](#methods)
store.dispatch(services.authManagement.create({ action: 'verifySignupLong',
    value: verifyToken,
  }, {})
);
```

#### Dispatching authentication

User must be verified to sign in. v0.x only.

```javascript
const reduxifyAuthentication = require('feathers-reduxify-authentication');
const signin = reduxifyAuthentication(app, { isUserAuthorized: (user) => user.isVerified });

// Sign in with the JWT currently in localStorage
if (localStorage['feathers-jwt']) {
  store.dispatch(signin.authenticate()).catch(err => { ... });
}

// Sign in with credentials
store.dispatch(signin.authenticate({ type: 'local', email, password }))
  .then(() => { ... )
  .catch(err => { ... });
```

### Vue

## Hooks

The service does not itself handle creation of a new user account nor the sending of the initial
sign up verification request.
Instead hooks are provided for you to use with the `users` service `create` method. If you set a service path other than the default of `'authManagement'`, the custom path name must be passed into the hook.

### `verifyHooks.addVerification( path = 'authManagement' )`

```javascript
const verifyHooks = require("feathers-authentication-management").hooks;
// users service
module.exports.before = {
  create: [
    auth.hashPassword(),
    verifyHooks.addVerification(), // adds .isVerified, .verifyExpires, .verifyToken, .verifyChanges
  ],
};
module.exports.after = {
  create: [
    hooks.remove("password"),
    aHookToEmailYourVerification(),
    verifyHooks.removeVerification(), // removes verification/reset fields other than .isVerified from the response
  ],
};
```

### `verifyHooks.isVerified()`

A hook is provided to ensure the user's email addr is verified:

```javascript
const auth = require('feathers-authentication').hooks;
const verifyHooks = require('feathers-authentication-management').hooks;
export.before = {
  create: [
    auth.authenticate('jwt'),
    verifyHooks.isVerified(),
  ]
};
```

## Multiple services

We have considered until now situations where authentication was based on a user item.
`feathers-authorization` however allows users to sign in with group and organization
credentials as well as user ones.

You can easily configure `feathers-authentication-management` to handle such situations.
Please refer to `test/multiInstances.test.js`.

## Database

The service adds the following optional properties to the user item.
You should add them to your user model if your database uses models.

```javascript
{
  isVerified: { type: Boolean },
  verifyToken: { type: String },
  verifyShortToken: { type: String },
  verifyExpires: { type: Date }, // or a long integer
  verifyChanges: // an object (key-value map), e.g. { field: "value" }
  resetToken: { type: String },
  resetShortToken: { type: String },
  resetExpires: { type: Date }, // or a long integer
  resetAttempts: { type: Number }
}
```

## Routing

The client handles all interactions with the user.
Therefore the server must serve the client app when, for example, a URL link is followed
for email addr verification.
The client must do some routing based on the path in the link.

Assume you have sent the email link:
`http://localhost:3030/socket/verify/12b827994bb59cacce47978567989e`

The server serves the client app on `/socket`:

```javascript
// Express-like middleware provided by Feathersjs.
app.use("/", serveStatic(app.get("public"))).use("/socket", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "public", "socket.html")); // serve the client
});
```

The client then routes itself based on the URL.
You will likely use you favorite client-side router,
but a primitive routing would be:

```javascript
const [leader, provider, action, slug] = window.location.pathname.split("/");

switch (action) {
  case "verify":
    verifySignUp(slug);
    break;
  case "reset":
    resetPassword(slug);
    break;
  default:
  // normal app startup
}
```

## Security

- The user must be identified when the short token is used, making the short token less appealing
  as an attack vector.
- The long and short tokens are erased on successful verification and password reset attempts.
  New tokens must be acquired for another attempt.
- API params are verified to be strings. If the param is an object, the values of its props are
  verified to be strings.
- options.identifyUserProps restricts the prop names allowed in param objects.
- In order to protect sensitive data, you should set a hook that prevent `PATCH` or `PUT` calls on
  authentication-management related properties:

```javascript
// in user service hook
before: {
  update: [
    iff(isProvider('external'), preventChanges(
      'isVerified',
      'verifyToken',
      'verifyShortToken',
      'verifyExpires',
      'verifyChanges',
      'resetToken',
      'resetShortToken',
      'resetExpires'
    )),
  ],
  patch: [
    iff(isProvider('external'), preventChanges(
      'isVerified',
      'verifyToken',
      'verifyShortToken',
      'verifyExpires',
      'verifyChanges',
      'resetToken',
      'resetShortToken',
      'resetExpires'
    )),
  ],
},
```

## Docs

_optional params_

Because this service doesn't use `app.use()` but `app.configure()`, you can't add documentation like it's recommended by [@feathers-swagger](feathers-swagger). Instead, you've just have to pass your docs through the second params.

```js
// authManagement.service.js
const docs = {
  description: "A service to manage authentication",
};

app.configure(authManagement(notifier(app), docs));
```

## Configurable

The length of the "30-char" token is configurable.
The length of the "6-digit" token is configurable. It may also be configured as alphanumeric.

## Tests

Run `npm test`.
