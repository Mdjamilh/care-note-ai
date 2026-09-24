import { NextResponse, type NextRequest } from "next/server";

import { WORKSPACE_COOKIE } from "@/lib/workspace";

/**
 * Gives every browser its own anonymous workspace on first visit, so demo
 * visitors never see each other's notes. Cookies can only be set here, in
 * route handlers or in server actions, not while rendering a page.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has(WORKSPACE_COOKIE)) return NextResponse.next();

  const workspaceId = crypto.randomUUID();
  // Make the cookie visible to this same request's server components too.
  request.cookies.set(WORKSPACE_COOKIE, workspaceId);
  const response = NextResponse.next({ request });
  response.cookies.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
