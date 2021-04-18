
import isNullsy from './is-nullsy';

/**
 * Verify that obj1 and obj2 have different 'field' field
 * Returns false if either object is null/undefined
 *
 * @param obj1
 * @param obj2
 */
export default function ensureFieldHasChanged (obj1: Record<string, unknown>, obj2: Record<string, unknown>): (field: string) => boolean {
  return (isNullsy(obj1) || isNullsy(obj2))
    ? () => false
    : field => obj1[field] !== obj2[field];
}
