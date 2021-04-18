---
title: Client
---

# {{ $frontmatter.title }}

The service may be called on the client using

[[toc]]

### 

```html
<html>
<body>
  <p id = "info">
    Sending token
  </p>
  <script>
    var url = new URL(window.location.href);
    var token = url.searchParams.get("token");
    var obj = {
      action: 'verifySignupLong',
      value: token
    }
    console.log(JSON.stringify(obj))
    console.log(obj)
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 201) {
           // Typical action to be performed when the document is ready:
           document.getElementById("info").innerHTML = 'Verification Successful for action <b>' + obj.action + '</b> and token <b>' + obj.value + '</b>';
        } else {
          document.getElementById("info").innerHTML = xhttp.response
        }
    };
    xhttp.open('POST', 'http://localhost:3030/authmanagement' , true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(obj));
  </script>
</body>
</html>
```

### Using Feathers method calls

Method calls return a Promise.

```js
const authManagementService = require("feathers-authentication-management");
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
let cbCalled = false;
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
  // or
const AuthManagement = require('feathers-authentication-management/lib/client');
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
