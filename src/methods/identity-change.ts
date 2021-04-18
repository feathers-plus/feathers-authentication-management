
import { BadRequest } from '@feathersjs/errors';
import makeDebug from 'debug';
import comparePasswords from '../helpers/compare-passwords';
import ensureObjPropsValid from '../helpers/ensure-obj-props-valid';
import getLongToken from '../helpers/get-long-token';
import getShortToken from '../helpers/get-short-token';
import getUserData from '../helpers/get-user-data';
import notifier from '../helpers/notifier';
import { IdentifyUser, IdentityChangeOptions, SanitizedUser } from '../types';

const debug = makeDebug('authLocalMgnt:identityChange');

// TODO: identifyUser

export default async function identityChange (
  options: IdentityChangeOptions,
  identifyUser: IdentifyUser,
  password: string,
  changesIdentifyUser: Record<string, unknown>,
  notifierOptions: Record<string, unknown> = {}
): Promise<SanitizedUser> {
  // note this call does not update the authenticated user info in hooks.params.user.
  debug('identityChange', password, changesIdentifyUser);
  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;
  const {
    delay,
    identifyUserProps,
    longTokenLen,
    shortTokenLen,
    shortTokenDigits,
    passwordField
  } = options;

  ensureObjPropsValid(identifyUser, identifyUserProps);
  ensureObjPropsValid(changesIdentifyUser, identifyUserProps);

  const users = await usersService.find({ query: identifyUser });
  const user1 = getUserData(users);

  try {
    await comparePasswords(password, user1[passwordField] as string);
  } catch (err) {
    throw new BadRequest('Password is incorrect.',
      { errors: { [passwordField]: 'Password is incorrect.', $className: 'badParams' } }
    );
  }

  const user2 = await usersService.patch(user1[usersServiceIdName], {
    verifyExpires: Date.now() + delay,
    verifyToken: await getLongToken(longTokenLen),
    verifyShortToken: await getShortToken(shortTokenLen, shortTokenDigits),
    verifyChanges: changesIdentifyUser
  });

  const user3 = await notifier(options.notifier, 'identityChange', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);
}
