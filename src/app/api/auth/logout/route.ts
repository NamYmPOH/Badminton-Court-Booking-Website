import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth-token";
import { apiOk } from "@/lib/http";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return apiOk({ loggedOut: true });
}
