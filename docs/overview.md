---
title: Overview
---

# {{ $frontmatter.title }}

![npm](https://img.shields.io/npm/v/feathers-authentication-management) 
<!--![GitHub Workflow Status](https://img.shields.io/github/workflow/status/feathersjs-ecosystem/feathers-authentication-management/Node.js%20CI)-->
![npm](https://img.shields.io/npm/dm/feathers-authentication-management) 
[![GitHub license](https://img.shields.io/github/license/feathersjs-ecosystem/feathers-authentication-management)](https://github.com/feathersjs-ecosystem/feathers-authentication-management/blob/master/LICENSE)

Sign up verification, forgotten password reset, and other capabilities for local authentication.

This project is built for [FeathersJS](http://feathersjs.com). An open source web framework for building modern real-time applications.

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

### Features

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

### Testing

`npm test`
This repo is pre-configured to work with the Visual Studio Code debugger. After running `npm install`, use the "Mocha Tests" debug script for a smooth debugging experience.

### Help

Open an issue or come talk on the FeathersJS Slack.

### License

Licensed under the [MIT license](LICENSE).
