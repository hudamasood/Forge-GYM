import bcrypt from "bcryptjs";
import type { IPasswordHasher } from "@/server/ports/security";

const COST = 12;

export class BcryptPasswordHasher implements IPasswordHasher {
  hash(plain: string) {
    return bcrypt.hash(plain, COST);
  }

  verify(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
