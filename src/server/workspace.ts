import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { WORKSPACE_COOKIE } from "@/lib/workspace";

/** The current browser's workspace id, set by middleware on first visit. */
export async function getWorkspaceId(): Promise<string> {
  const value = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new Error("Missing workspace cookie; is the middleware running?");
  return parsed.data;
}
