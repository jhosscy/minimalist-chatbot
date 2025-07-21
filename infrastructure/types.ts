import type { BrotliOptions } from 'node:zlib';

export type BrotliCompressor = (
  payload: string | Buffer, 
  options?: BrotliOptions
) => Promise<Buffer>;
