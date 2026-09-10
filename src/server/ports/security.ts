export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

/** Injected clock so time-dependent rules are deterministic in tests. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
