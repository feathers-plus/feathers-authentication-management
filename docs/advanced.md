---
title: Advanced Usage
---

# {{ $frontmatter.title }}

[[toc]]

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
