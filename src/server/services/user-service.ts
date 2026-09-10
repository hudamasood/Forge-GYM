import { createHash, randomBytes } from "node:crypto";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "@/server/domain/errors";
import type { Role, User } from "@/server/domain/types";
import type { IPasswordResetTokenRepository, IUserRepository, PageRequest, UpdateUserInput } from "@/server/repositories/interfaces";
import type { Clock, IPasswordHasher } from "@/server/ports/security";
import type { NotificationService } from "@/server/services/notification-service";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_MIN_LENGTH = 8;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertStrongPassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters and include a letter and a number`, {
      password: ["Too weak"],
    });
  }
}

/** Accounts, credentials and password reset. */
export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly resetTokens: IPasswordResetTokenRepository,
    private readonly hasher: IPasswordHasher,
    private readonly notifications: NotificationService,
    private readonly now: Clock,
  ) {}

  async signup(input: { email: string; name: string; password: string; phone?: string | null }): Promise<User> {
    const email = normalizeEmail(input.email);
    assertStrongPassword(input.password);
    if (await this.users.findByEmailWithPassword(email)) throw new ConflictError("An account with this email already exists");

    const user = await this.users.create({
      email,
      name: input.name.trim(),
      phone: input.phone ?? null,
      passwordHash: await this.hasher.hash(input.password),
      role: "MEMBER",
    });
    await this.notifications.welcome(user.email, user.name).catch(() => undefined);
    return user;
  }

  /** Returns the user for valid credentials, otherwise null. Timing-safe against unknown emails. */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.users.findByEmailWithPassword(normalizeEmail(email));
    if (!user?.passwordHash) {
      await this.hasher.hash(password); // equalize timing
      return null;
    }
    if (!(await this.hasher.verify(password, user.passwordHash))) return null;
     
    const { passwordHash, ...safe } = user;
    return safe;
  }

  /** Always resolves the same way whether or not the email exists (no account enumeration). */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmailWithPassword(normalizeEmail(email));
    if (!user) return;
    const now = this.now();
    await this.resetTokens.invalidateAllForUser(user.id, now);
    const token = randomBytes(32).toString("base64url");
    await this.resetTokens.create(user.id, hashToken(token), new Date(now.getTime() + RESET_TOKEN_TTL_MS));
    await this.notifications.passwordReset(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    assertStrongPassword(newPassword);
    const now = this.now();
    const tokenHash = hashToken(token);
    const userId = await this.resetTokens.findValidUserId(tokenHash, now);
    if (!userId) throw new ValidationError("This reset link is invalid or has expired");
    await this.users.updatePassword(userId, await this.hasher.hash(newPassword));
    await this.resetTokens.markUsed(tokenHash, now);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const withPassword = await this.users.findByEmailWithPassword(user.email);
    if (!withPassword?.passwordHash || !(await this.hasher.verify(currentPassword, withPassword.passwordHash))) {
      throw new UnauthorizedError("Your current password is incorrect");
    }
    assertStrongPassword(newPassword);
    await this.users.updatePassword(userId, await this.hasher.hash(newPassword));
  }

  async getById(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  updateProfile(userId: string, input: Pick<UpdateUserInput, "name" | "phone">) {
    return this.users.update(userId, { name: input.name?.trim(), phone: input.phone });
  }

  list(request: PageRequest & { role?: Role }) {
    return this.users.list(request);
  }

  async adminUpdate(actorId: string, userId: string, input: UpdateUserInput) {
    if (actorId === userId && input.role && input.role !== "ADMIN") throw new ValidationError("You cannot remove your own admin role");
    await this.getById(userId);
    return this.users.update(userId, input);
  }

  async adminDelete(actorId: string, userId: string) {
    if (actorId === userId) throw new ValidationError("You cannot delete your own account");
    await this.getById(userId);
    await this.users.delete(userId);
  }
}
