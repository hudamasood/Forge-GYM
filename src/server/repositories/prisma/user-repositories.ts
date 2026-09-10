import type { Prisma } from "@prisma/client";
import type { User } from "@/server/domain/types";
import type { CreateUserInput, IPasswordResetTokenRepository, IUserRepository, PageRequest, UpdateUserInput } from "@/server/repositories/interfaces";
import type { Role } from "@/server/domain/types";
import { type Db, defined, pageArgs, toPage, uniqueOrConflict } from "./shared";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  stripeCustomerId: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id }, select: userSelect });
  }

  findByEmailWithPassword(email: string) {
    return this.db.user.findUnique({ where: { email }, select: { ...userSelect, passwordHash: true } });
  }

  create(input: CreateUserInput) {
    return uniqueOrConflict(
      () =>
        this.db.user.create({
          data: { email: input.email, name: input.name, passwordHash: input.passwordHash, role: input.role ?? "MEMBER", phone: input.phone ?? null },
          select: userSelect,
        }),
      "An account with this email already exists",
    );
  }

  update(id: string, input: UpdateUserInput) {
    return this.db.user.update({ where: { id }, data: defined(input), select: userSelect });
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.db.user.update({ where: { id }, data: { passwordHash } });
  }

  async setStripeCustomerId(id: string, customerId: string) {
    await this.db.user.update({ where: { id }, data: { stripeCustomerId: customerId } });
  }

  async list(request: PageRequest & { role?: Role }) {
    const args = pageArgs(request);
    const where: Prisma.UserWhereInput = {
      role: request.role,
      ...(request.search
        ? { OR: [{ email: { contains: request.search, mode: "insensitive" } }, { name: { contains: request.search, mode: "insensitive" } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.user.findMany({ where, select: userSelect, orderBy: { createdAt: "desc" }, skip: args.skip, take: args.take }),
      this.db.user.count({ where }),
    ]);
    return toPage(items, total, args);
  }

  async delete(id: string) {
    await this.db.user.delete({ where: { id } });
  }
}

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly db: Db) {}

  async create(userId: string, tokenHash: string, expiresAt: Date) {
    await this.db.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findValidUserId(tokenHash: string, now: Date) {
    const token = await this.db.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: now } }, select: { userId: true } });
    return token?.userId ?? null;
  }

  async markUsed(tokenHash: string, now: Date) {
    await this.db.passwordResetToken.updateMany({ where: { tokenHash }, data: { usedAt: now } });
  }

  async invalidateAllForUser(userId: string, now: Date) {
    await this.db.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  }
}
