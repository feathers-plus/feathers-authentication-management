import { BadRequest } from '@feathersjs/errors';
import { Query } from '@feathersjs/feathers';
import makeDebug from 'debug';
import ensureObjPropsValid from '../helpers/ensure-obj-props-valid';
import ensureValuesAreStrings from '../helpers/ensure-values-are-strings';
import getUserData from '../helpers/get-user-data';
import notifier from '../helpers/notifier';
import isDateAfterNow from '../helpers/is-date-after-now';
import { SanitizedUser, VerifySignupOptions, VerifySignupWithShortTokenOptions, Tokens, User, VerifyChanges, IdentifyUser } from '../types';

const debug = makeDebug('authLocalMgnt:verifySignup');

export async function verifySignupWithLongToken (
  options: VerifySignupOptions,
  verifyToken: string,
  notifierOptions = {}
): Promise<SanitizedUser> {
  ensureValuesAreStrings(verifyToken);

  const result = await verifySignup(options, { verifyToken }, { verifyToken }, notifierOptions);
  return result;
}

export async function verifySignupWithShortToken (
  options: VerifySignupWithShortTokenOptions,
  verifyShortToken: string,
  identifyUser: IdentifyUser,
  notifierOptions = {}
): Promise<SanitizedUser> {
  ensureValuesAreStrings(verifyShortToken);
  ensureObjPropsValid(identifyUser, options.identifyUserProps);

  const result = await verifySignup(options, identifyUser, { verifyShortToken }, notifierOptions);
  return result;
}

async function verifySignup (
  options: VerifySignupOptions,
  query: Query,
  tokens: Tokens,
  notifierOptions = {}
): Promise<SanitizedUser> {
  debug('verifySignup', query, tokens);
  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;

  const users = await usersService.find({ query });
  const user1 = getUserData(users, ['isNotVerifiedOrHasVerifyChanges', 'verifyNotExpired']);

  if (!Object.keys(tokens).every(key => tokens[key] === user1[key])) {
    await eraseVerifyProps(user1, user1.isVerified);

    throw new BadRequest('Invalid token. Get for a new one. (authLocalMgnt)',
      { errors: { $className: 'badParam' } }
    );
  }

  const user2 = await eraseVerifyProps(user1, isDateAfterNow(user1.verifyExpires), user1.verifyChanges || {});
  const user3 = await notifier(options.notifier, 'verifySignup', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);

  async function eraseVerifyProps (user: User, isVerified: boolean, verifyChanges?: VerifyChanges): Promise<User> {
    const patchToUser = Object.assign({}, verifyChanges ?? {}, {
      isVerified,
      verifyToken: null,
      verifyShortToken: null,
      verifyExpires: null,
      verifyChanges: {}
    });

    const result = await usersService.patch(user[usersServiceIdName], patchToUser, {});
    return result;
  }
}
