import crypto from "crypto";
import { REGISTERED_STUDENTS, RegisteredStudentSeed } from "./constants";

// In-memory rate limiting and account lockout store
interface RateLimitRecord {
  attempts: number;
  lockoutUntil: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout after 5 consecutive failures

export function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin.trim()).digest("hex");
}

export function checkRateLimit(studentId: string): { allowed: boolean; remainingLockoutSec?: number } {
  const record = loginAttempts.get(studentId);
  const now = Date.now();

  if (!record) {
    return { allowed: true };
  }

  if (record.lockoutUntil > now) {
    const remainingSec = Math.ceil((record.lockoutUntil - now) / 1000);
    return { allowed: false, remainingLockoutSec: remainingSec };
  }

  if (record.lockoutUntil !== 0 && record.lockoutUntil <= now) {
    // Reset lockout window
    loginAttempts.delete(studentId);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordLoginAttempt(studentId: string, success: boolean): void {
  const now = Date.now();
  const record = loginAttempts.get(studentId) || { attempts: 0, lockoutUntil: 0 };

  if (success) {
    loginAttempts.delete(studentId);
    return;
  }

  record.attempts += 1;
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_DURATION_MS;
    record.attempts = 0;
  }
  loginAttempts.set(studentId, record);
}

export function verifyStudentCredentials(studentId: string, pin: string): {
  success: boolean;
  student?: RegisteredStudentSeed;
  error?: string;
  remainingLockoutSec?: number;
} {
  const rateLimit = checkRateLimit(studentId);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Akun terkunci sementara karena salah PIN berulang kali. Silakan coba lagi dalam ${rateLimit.remainingLockoutSec} detik.`,
      remainingLockoutSec: rateLimit.remainingLockoutSec,
    };
  }

  const student = REGISTERED_STUDENTS.find((s) => s.id === studentId);
  if (!student) {
    return { success: false, error: "Identitas siswa tidak ditemukan." };
  }

  const hashedInput = hashPin(pin);
  if (hashedInput !== student.pin_hash) {
    recordLoginAttempt(studentId, false);
    return { success: false, error: "PIN yang Anda masukkan salah." };
  }

  recordLoginAttempt(studentId, true);
  return { success: true, student };
}

export function createSessionToken(student: RegisteredStudentSeed): string {
  const payload = {
    id: student.id,
    name: student.name,
    class: student.class,
    nis: student.nis,
    daily_goal_ml: student.daily_goal_ml,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const secret = process.env.SESSION_SECRET || "sija_jwt_session_secret_change_in_production_2026";
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(base64Payload).digest("base64url");
  return `${base64Payload}.${signature}`;
}

export function verifySessionToken(token: string): RegisteredStudentSeed | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [base64Payload, signature] = parts;
    const secret = process.env.SESSION_SECRET || "sija_jwt_session_secret_change_in_production_2026";
    const expectedSig = crypto.createHmac("sha256", secret).update(base64Payload).digest("base64url");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString());
    if (Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      name: payload.name,
      class: payload.class,
      nis: payload.nis,
      daily_goal_ml: payload.daily_goal_ml,
      pin_hash: "",
    };
  } catch {
    return null;
  }
}
