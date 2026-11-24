import crypto from "crypto";

/**
 * Validates hardware ESP32 requests against configured DEVICE_TOKEN_SHA256.
 * The ESP32 sends its raw secret token in the `X-Device-Token` header.
 * The server securely computes the SHA-256 hash and compares with the environment variable
 * using timing-safe comparison to prevent timing attacks.
 */
export function validateDeviceToken(rawToken: string | null | undefined): boolean {
  if (!rawToken) {
    return false;
  }

  // The configured SHA256 of the valid token
  const expectedHash = process.env.DEVICE_TOKEN_SHA256;

  // Fallback for demonstration when .env is not yet configured
  // Token default: "sija_dispenser_super_secret_token_2026"
  const defaultHash = "03ff1e2465f3e6d9030703ff2b76b936221ccdb169bde59e3364f7e6d8f83cbd";
  const targetHash = expectedHash || defaultHash;

  try {
    const calculatedHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
    
    // Constant-time buffer comparison to prevent timing attacks
    const bufA = Buffer.from(calculatedHash, "utf-8");
    const bufB = Buffer.from(targetHash, "utf-8");

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    console.error("[Device Auth Error]:", e);
    return false;
  }
}
