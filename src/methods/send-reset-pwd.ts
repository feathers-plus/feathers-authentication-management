import makeDebug from 'debug';
import concatIDAndHash from '../helpers/concat-id-and-hash';
import ensureObjPropsValid from '../helpers/ensure-obj-props-valid';
import getLongToken from '../helpers/get-long-token';
import getShortToken from '../helpers/get-short-token';
import getUserData from '../helpers/get-user-data';
import hashPassword from '../helpers/hash-password';
import notifier from '../helpers/notifier';
import { Id } from '@feathersjs/feathers';
import { IdentifyUser, SanitizedUser, SendResetPwdOptions } from '../types';

const debug = makeDebug('authLocalMgnt:sendResetPwd');

export default async function sendResetPwd (
  options: SendResetPwdOptions,
  identifyUser: IdentifyUser,
  notifierOptions = {}
): Promise<SanitizedUser> {
  debug('sendResetPwd');
  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;

  ensureObjPropsValid(identifyUser, options.identifyUserProps);

  const users = await usersService.find({ query: identifyUser });
  const user1 = getUserData(users, options.skipIsVerifiedCheck ? [] : ['isVerified']);

  if (
    // Use existing token when it's not hashed,
    options.reuseResetToken && user1.resetToken && user1.resetToken.includes('___') &&
    // and remaining time exceeds half of resetDelay
    user1.resetExpires > Date.now() + options.resetDelay / 2
  ) {
    await notifier(options.notifier, 'sendResetPwd', user1, notifierOptions);
    return options.sanitizeUserForClient(user1);
  }

  const user2 = Object.assign(user1, {
    resetExpires: Date.now() + options.resetDelay,
    resetAttempts: options.resetAttempts,
    resetToken: concatIDAndHash(user1[usersServiceIdName] as Id, await getLongToken(options.longTokenLen)),
    resetShortToken: await getShortToken(options.shortTokenLen, options.shortTokenDigits)
  });

  await notifier(options.notifier, 'sendResetPwd', user2, notifierOptions);
  const user3 = await usersService.patch(user2[usersServiceIdName], {
    resetExpires: user2.resetExpires,
    resetAttempts: user2.resetAttempts,
    resetToken:
      options.reuseResetToken
        ? user2.resetToken
        : await hashPassword(options.app, user2.resetToken, options.passwordField),
    resetShortToken:
      options.reuseResetToken
        ? user2.resetShortToken
        : await hashPassword(options.app, user2.resetShortToken, options.passwordField)
  });

  return options.sanitizeUserForClient(user3);
}
