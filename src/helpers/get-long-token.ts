
import randomBytes from './random-bytes';

export default async (len: number): Promise<string> => await randomBytes(len);
