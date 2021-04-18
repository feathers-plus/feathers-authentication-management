import crypto from 'crypto';

export default async function randomBytes (len: number): Promise<string> {
  return await new Promise((resolve, reject) => {
    crypto.randomBytes(len, (err, buf) => err ? reject(err) : resolve(buf.toString('hex')));
  });
}
