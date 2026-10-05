import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "dev-secret-smashbook-token-must-be-long-key-2026";
const COOKIE_NAME = "sb_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 ngày

interface TokenPayload {
  userId: string;
  exp: number;
}

export function signSessionToken(userId: string): string {
  const payload: TokenPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("base64url");

    // Timing safe comparison
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadRaw = Buffer.from(data, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadRaw) as TokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
