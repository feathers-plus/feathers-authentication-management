/**
 * Returns new object with values cloned from the original object. Some objects
 * (like Sequelize or MongoDB model instances) contain circular references
 * and cause TypeError when trying to JSON.stringify() them. They may contain
 * custom toJSON() or toObject() method which allows to serialize them safely.
 * Object.assign() does not clone these methods, so the purpose of this method
 * is to use result of custom toJSON() or toObject() (if accessible)
 * for Object.assign(), but only in case of serialization failure.
 *
 * @param  obj - Object to clone
 * @returns Cloned object
 */
export default function cloneObject<T extends Record<string, unknown>> (obj: T): T {
  if (typeof obj.toJSON === 'function' || typeof obj.toObject === 'function') {
    try {
      JSON.stringify(Object.assign({}, obj));
    } catch (err) {
      return (typeof obj.toJSON === 'function')
        ? obj.toJSON()
        // @ts-expect-error does not know about toObject()
        : obj.toObject();
    }
  }

  return Object.assign({}, obj);
}
