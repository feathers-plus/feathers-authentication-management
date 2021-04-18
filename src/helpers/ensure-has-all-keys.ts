import { GeneralError } from '@feathersjs/errors';

export default function ensureHasAllKeys<K extends string> (obj: Record<K, unknown>, keys: K[], identifier: string): void {
  const missingKeys = keys.filter(key => !Object.prototype.hasOwnProperty.call(obj, key));

  if (missingKeys.length) {
    throw new GeneralError(`Missing keys: '${missingKeys.join(' ')}'! for ${identifier}`);
  }
}
