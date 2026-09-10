import { beforeEach, describe, expect, it } from "vitest";
import { UserService } from "@/server/services/user-service";
import { NotificationService } from "@/server/services/notification-service";
import { ConflictError, UnauthorizedError, ValidationError } from "@/server/domain/errors";
import { MemoryPasswordResetTokenRepository, MemoryUserRepository, type MemoryStore } from "@/server/repositories/memory";
import { PlainHasher, RecordingNotificationChannel, buildWorld, clock } from "@/server/testing/fixtures";

describe("UserService", () => {
  let db: MemoryStore;
  let channel: RecordingNotificationChannel;
  let service: UserService;

  beforeEach(() => {
    db = buildWorld().db;
    channel = new RecordingNotificationChannel();
    service = new UserService(
      new MemoryUserRepository(db),
      new MemoryPasswordResetTokenRepository(db),
      new PlainHasher(),
      new NotificationService(channel, "https://forge.test"),
      clock,
    );
  });

  it("signs up a member with a normalized email and hashed password", async () => {
    const user = await service.signup({ email: "  New@Test.dev ", name: "New", password: "Password1" });
    expect(user.email).toBe("new@test.dev");
    expect(user.role).toBe("MEMBER");
    expect(db.users.find((u) => u.id === user.id)!.passwordHash).toBe("hashed:Password1");
    expect(channel.sent[0].subject).toMatch(/Welcome/);
  });

  it("never lets signup choose a role", async () => {
    const user = await service.signup({ email: "x@test.dev", name: "X", password: "Password1", ...({ role: "ADMIN" } as object) });
    expect(user.role).toBe("MEMBER");
  });

  it("rejects duplicate emails and weak passwords", async () => {
    await expect(service.signup({ email: "yogi@test.dev", name: "Y", password: "Password1" })).rejects.toBeInstanceOf(ConflictError);
    await expect(service.signup({ email: "weak@test.dev", name: "W", password: "short" })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.signup({ email: "weak@test.dev", name: "W", password: "lettersonly" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("verifies credentials without leaking the hash", async () => {
    const user = await service.verifyCredentials("YOGI@test.dev", "Password1");
    expect(user?.id).toBe("usr_yoga");
    expect(user).not.toHaveProperty("passwordHash");
    await expect(service.verifyCredentials("yogi@test.dev", "wrong")).resolves.toBeNull();
    await expect(service.verifyCredentials("ghost@test.dev", "Password1")).resolves.toBeNull();
  });

  it("resets a password with a single-use emailed token", async () => {
    await service.requestPasswordReset("yogi@test.dev");
    const token = decodeURIComponent(channel.sent[0].text.match(/token=([^\s.]+)/)![1]);

    await service.resetPassword(token, "NewPassword9");
    await expect(service.verifyCredentials("yogi@test.dev", "NewPassword9")).resolves.not.toBeNull();
    await expect(service.resetPassword(token, "Another1234")).rejects.toThrow(/invalid or has expired/);
  });

  it("does not reveal whether an email exists on reset", async () => {
    await expect(service.requestPasswordReset("ghost@test.dev")).resolves.toBeUndefined();
    expect(channel.sent).toHaveLength(0);
  });

  it("requires the current password to change it", async () => {
    await expect(service.changePassword("usr_yoga", "wrong", "Password22")).rejects.toBeInstanceOf(UnauthorizedError);
    await service.changePassword("usr_yoga", "Password1", "Password22");
    await expect(service.verifyCredentials("yogi@test.dev", "Password22")).resolves.not.toBeNull();
  });

  it("stops an admin from demoting or deleting themselves", async () => {
    await expect(service.adminUpdate("usr_admin", "usr_admin", { role: "MEMBER" })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.adminDelete("usr_admin", "usr_admin")).rejects.toBeInstanceOf(ValidationError);
  });
});
