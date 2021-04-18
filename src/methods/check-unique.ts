import { BadRequest } from '@feathersjs/errors';
import isNullsy from '../helpers/is-nullsy';
import makeDebug from 'debug';
import { Id } from '@feathersjs/feathers';
import { CheckUniqueOptions, IdentifyUser } from '../types';

const debug = makeDebug('authLocalMgnt:checkUnique');

/**
 * This module is usually called from the UI to check username, email, etc. are unique.
 */
export default async function checkUnique (
  options: CheckUniqueOptions,
  identifyUser: IdentifyUser,
  ownId?: Id,
  meta?: { noErrMsg?: boolean}
): Promise<null> {
  debug('checkUnique', identifyUser, ownId, meta);

  ownId = ownId || null;
  meta = meta || {};

  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;
  const allProps = [];

  const keys = Object.keys(identifyUser).filter(
    key => !isNullsy(identifyUser[key])
  );

  try {
    for (let i = 0, ilen = keys.length; i < ilen; i++) {
      const prop = keys[i];
      const users = await usersService.find({ query: { [prop]: identifyUser[prop].trim() } });
      const items = Array.isArray(users) ? users : users.data;
      const isNotUnique = items.length > 1 ||
        (items.length === 1 && items[0][usersServiceIdName] !== ownId);
      allProps.push(isNotUnique ? prop : null);
    }
  } catch (err) {
    throw new BadRequest(meta.noErrMsg ? null : 'checkUnique unexpected error.',
      { errors: { msg: err.message, $className: 'unexpected' } }
    );
  }

  const errProps = allProps.filter(prop => prop);

  if (errProps.length) {
    const errs = {};
    errProps.forEach(prop => { errs[prop] = 'Already taken.'; });

    throw new BadRequest(meta.noErrMsg ? null : 'Values already taken.',
      { errors: errs }
    );
  }

  return null;
}
