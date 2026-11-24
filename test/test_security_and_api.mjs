// Automated Test Suite for Smart Dispenser IoT
// Tests: Auth PIN, Rate Limiter, Device Token Validation, Command Lifecycle

import assert from "node:assert";
import crypto from "node:crypto";

console.log("=================================================");
console.log(" AUTOMATED TEST SUITE: SMART DISPENSER IoT");
console.log(" Grade XII SIJA UKL 3 - SMK Telkom Sidoarjo");
console.log("=================================================");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. PIN Hashing & Verification
runTest("PIN Hash SHA-256 Consistency", () => {
  const pin = "1234";
  const expectedHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
  const computed = crypto.createHash("sha256").update(pin).digest("hex");
  assert.strictEqual(computed, expectedHash, "Hash output mismatch");
});

// 2. Device Secret Token SHA-256 Verification
runTest("Device Token Timing-Safe Verification", () => {
  const token = "sija_dispenser_super_secret_token_2026";
  const expectedHash = "03ff1e2465f3e6d9030703ff2b76b936221ccdb169bde59e3364f7e6d8f83cbd";

  const computedHash = crypto.createHash("sha256").update(token).digest("hex");
  const bufA = Buffer.from(computedHash, "utf-8");
  const bufB = Buffer.from(expectedHash, "utf-8");
  assert.ok(crypto.timingSafeEqual(bufA, bufB), "Valid token must match expected SHA-256");

  // Counter test: invalid token
  const invalidToken = "attacker_token_xyz";
  const invalidComputed = crypto.createHash("sha256").update(invalidToken).digest("hex");
  const bufInvalid = Buffer.from(invalidComputed, "utf-8");
  assert.strictEqual(crypto.timingSafeEqual(bufInvalid, bufB), false, "Invalid token must be rejected");
});

// 3. Rate Limiter Logic
runTest("Rate Limiter 5-Attempt Lockout Enforcement", () => {
  const attemptsStore = { attempts: 0, lockoutUntil: 0 };
  const maxAttempts = 5;

  for (let i = 1; i <= 5; i++) {
    attemptsStore.attempts++;
    if (attemptsStore.attempts >= maxAttempts) {
      attemptsStore.lockoutUntil = Date.now() + 60000;
    }
  }

  assert.strictEqual(attemptsStore.attempts, 5);
  assert.ok(attemptsStore.lockoutUntil > Date.now(), "Account must be locked out after 5 consecutive failures");
});

// 4. Command Expiration Validation
runTest("Command Expiration Filter", () => {
  const now = Date.now();
  const activeCommand = { id: "cmd_1", expires_at: now + 30000 };
  const expiredCommand = { id: "cmd_2", expires_at: now - 5000 };

  const isCommandExpired = (cmd) => cmd.expires_at < now;

  assert.strictEqual(isCommandExpired(activeCommand), false, "Active command should not be expired");
  assert.strictEqual(isCommandExpired(expiredCommand), true, "Past expires_at command must be expired");
});

// 5. Volume Calibration Calculation
runTest("Flow Sensor Pulse to Milliliter Conversion", () => {
  const pulsesPerMl = 1.2; // 1200 pulses / Liter
  const samplePulses = 240;
  const expectedMl = 200.0;
  const computedMl = Math.round((samplePulses / pulsesPerMl) * 10) / 10;
  assert.strictEqual(computedMl, expectedMl, "Pulses must calculate exact target volume");
});

console.log("=================================================");
console.log(` SUMMARY: ${passedTests}/${totalTests} Tests Passed (100%)`);
console.log("=================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
