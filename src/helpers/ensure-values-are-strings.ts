
import { BadRequest } from '@feathersjs/errors';

export default function ensureValuesAreStrings (...rest: string[]): void {
  if (!rest.every(str => typeof str === 'string')) {
    throw new BadRequest('Expected string value. (authLocalMgnt)',
      { errors: { $className: 'badParams' } }
    );
  }
}
