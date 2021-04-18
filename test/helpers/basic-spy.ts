
/**
 * Create a light weight spy on functions.
 *
 * @param {Function} fcn - to spy on
 * @returns {Object} spy. Call fcn with spy.callWith(...). Get params and results with spy.result().
 * @class
 *
 * (1) To test a function without a callback:
 *
 * function test(a, b, c) { return ['y', false, [a, b, c]]; }
 * const spyTest = new feathersStub.SpyOn(test);
 * spyTest.callWith(1, 2, 3);
 * spyTest.callWith(4, 5, 6);
 *
 * spyTest.result();
 * // [ { args: [1, 2, 3], result: ['y', false, [1, 2, 3]] },
 * //   { args: [4, 5, 6], result: ['y', false, [4, 5, 6]] } ]
 *
 * (2) To test a function with a callback as the last param:
 *
 * function testCb(a, b, c, cb) { setTimeout(() => {  return cb('a', true, [a, b, c]); }, 0); }
 * const spyTestCb = SpyOn(testCb);
 * spyTestCb.callWithCb(1, 2, 3, (x, y, z) => {
 *   spyTestCb.callWithCb(8, 9, 0, (x, y, z) => {
 *
 *     spyTestCb.result()
 *     // [ { args: [1, 2, 3], result: ['a', true, [1, 2, 3]] },
 *     //   { args: [8, 9, 0], result: ['a', true, [8, 9, 0]] } ]
 *   });
 * });
 */

function SpyOn (fcn) {
  const stack = [];

  // spy on function without a callback
  // not being part of prototype chain allows callers to set 'this'

  this.callWith = function (...args) {
    const myStackOffset = stack.length;
    stack.push({ args: clone(args) });
    const result = fcn.apply(this, args);
    stack[myStackOffset].result = result; // can handle recursion

    return result;
  };

  // spy on function with a callback
  // not being part of prototype chain allows callers to set 'this'

  this.callWithCb = function (...args) {
    const myStackOffset = stack.length;
    stack.push({ args: args.slice(0, -1) });

    args[args.length - 1] = cbWrapper(args[args.length - 1]);
    fcn.apply(this, args);

    function cbWrapper (fcnCb) {
      return function cbWrapperInner (...args1) {
        stack[myStackOffset].result = args1;

        fcnCb.apply(this, args1);
      };
    }
  };

  // return spy info

  this.result = function () {
    return stack;
  };

  return this;
}

export default SpyOn;

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
