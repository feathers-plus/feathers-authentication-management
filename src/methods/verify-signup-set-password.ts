import { BadRequest } from '@feathersjs/errors';
import makeDebug from 'debug';
import ensureObjPropsValid from '../helpers/ensure-obj-props-valid';
import ensureValuesAreStrings from '../helpers/ensure-values-are-strings';
import getUserData from '../helpers/get-user-data';
import hashPassword from '../helpers/hash-password';
import notifier from '../helpers/notifier';
import {
  IdentifyUser,
  SanitizedUser,
  Tokens,
  User,
  VerifyChanges,
  VerifySignupSetPasswordOptions,
  VerifySignupSetPasswordWithShortTokenOptions
} from '../types';

const debug = makeDebug('authLocalMgnt:verifySignupSetPassword');

export async function verifySignupSetPasswordWithLongToken (
  options: VerifySignupSetPasswordOptions,
  verifyToken: string,
  password: string,
  notifierOptions = {}
): Promise<SanitizedUser> {
  ensureValuesAreStrings(verifyToken, password);

  const result = await verifySignupSetPassword(
    options,
    { verifyToken },
    { verifyToken },
    password,
    notifierOptions
  );
  return result;
}

export async function verifySignupSetPasswordWithShortToken (
  options: VerifySignupSetPasswordWithShortTokenOptions,
  verifyShortToken: string,
  identifyUser: IdentifyUser,
  password: string,
  notifierOptions = {}
): Promise<SanitizedUser> {
  ensureValuesAreStrings(verifyShortToken, password);
  ensureObjPropsValid(identifyUser, options.identifyUserProps);

  const result = await verifySignupSetPassword(
    options,
    identifyUser,
    {
      verifyShortToken
    },
    password,
    notifierOptions
  );
  return result;
}

async function verifySignupSetPassword (
  options: VerifySignupSetPasswordOptions,
  query: IdentifyUser,
  tokens: Tokens,
  password: string,
  notifierOptions = {}
): Promise<SanitizedUser> {
  debug('verifySignupSetPassword', query, tokens, password);
  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;

  const users = await usersService.find({ query });
  const user1 = getUserData(users, [
    'isNotVerifiedOrHasVerifyChanges',
    'verifyNotExpired'
  ]);

  if (!Object.keys(tokens).every((key) => tokens[key] === user1[key])) {
    await eraseVerifyPropsSetPassword(user1, user1.isVerified, {}, password);

    throw new BadRequest(
      'Invalid token. Get for a new one. (authLocalMgnt)',
      { errors: { $className: 'badParam' } }
    );
  }

  const user2 = await eraseVerifyPropsSetPassword(
    user1,
    user1.verifyExpires > Date.now(),
    user1.verifyChanges || {},
    password
  );

  const user3 = await notifier(options.notifier, 'verifySignupSetPassword', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);

  async function eraseVerifyPropsSetPassword (
    user: User,
    isVerified: boolean,
    verifyChanges: VerifyChanges,
    password: string
  ): Promise<User> {
    const hashedPassword = await hashPassword(options.app, password, options.passwordField);

    const patchToUser = Object.assign({}, verifyChanges || {}, {
      isVerified,
      verifyToken: null,
      verifyShortToken: null,
      verifyExpires: null,
      verifyChanges: {},
      password: hashedPassword
    });

    const result = await usersService.patch(user[usersServiceIdName], patchToUser, {});
    return result;
  }
}
