import { assert } from "chai";

function aboutEqualDateTime (time1: number, time2: number, msg?: string, delta?: number) {
  delta = delta || 600;
  const diff = Math.abs(time1 - time2);
  assert.isAtMost(diff, delta, msg || `times differ by ${diff}ms`);
}

export default aboutEqualDateTime;
