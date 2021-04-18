import { defaultVerifyDelay } from './config';

function makeDateTime (options1?: { delay?: number }): number {
  options1 = options1 || {};
  return Date.now() + (options1.delay || defaultVerifyDelay);
}

export default makeDateTime;
