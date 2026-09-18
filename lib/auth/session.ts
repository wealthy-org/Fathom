import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export interface FathomSession {
  walletAddress?: string;
  nonce?: string;
  authenticated?: boolean;
}

const COOKIE_NAME = "fathom_session";

function sessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set with at least 32 characters.");
  }
  return secret;
}

export async function getSession(): Promise<IronSession<FathomSession>> {
  return getIronSession<FathomSession>(await cookies(), {
    password: sessionPassword(),
    cookieName: COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  });
}
