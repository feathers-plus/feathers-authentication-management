
import cloneObject from './clone-object';
import comparePasswords from './compare-passwords';
import concatIDAndHash from './concat-id-and-hash';
import deconstructId from './deconstruct-id';
import ensureFieldHasChanged from './ensure-field-has-changed';
import ensureObjPropsValid from './ensure-obj-props-valid';
import ensureValuesAreStrings from './ensure-values-are-strings';
import getLongToken from './get-long-token';
import getShortToken from './get-short-token';
import getUserData from './get-user-data';
import hashPassword from './hash-password';
import isNullsy from './is-nullsy';
import notifier from './notifier';
import randomBytes from './random-bytes';
import randomDigits from './random-digits';
import sanitizeUserForClient from './sanitize-user-for-client';
import sanitizeUserForNotifier from './sanitize-user-for-notifier';

const helpers = {
  cloneObject,
  comparePasswords,
  concatIDAndHash,
  deconstructId,
  ensureFieldHasChanged,
  ensureObjPropsValid,
  ensureValuesAreStrings,
  getLongToken,
  getShortToken,
  getUserData,
  hashPassword,
  isNullsy,
  notifier,
  randomBytes, // for testing, make safe from hacking
  randomDigits, // for testing, make safe from hacking
  sanitizeUserForClient,
  sanitizeUserForNotifier
};

export {
  cloneObject,
  comparePasswords,
  concatIDAndHash,
  deconstructId,
  ensureFieldHasChanged,
  ensureObjPropsValid,
  ensureValuesAreStrings,
  getLongToken,
  getShortToken,
  getUserData,
  hashPassword,
  isNullsy,
  notifier,
  randomBytes, // for testing, make safe from hacking
  randomDigits, // for testing, make safe from hacking
  sanitizeUserForClient,
  sanitizeUserForNotifier
};

export default helpers;

// commonjs
if (typeof module !== 'undefined') {
  module.exports = Object.assign(helpers, module.exports);
}
