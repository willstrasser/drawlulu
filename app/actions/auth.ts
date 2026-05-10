"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { upsertUser } from "@/lib/ensure-user";
import { getSession } from "@/lib/iron-session";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

export type GuestSignupState = {
  ok: boolean;
  error?: string;
  username?: string;
};

const INITIAL: GuestSignupState = { ok: false };
export const initialGuestSignupState = INITIAL;

export async function signInAsGuest(
  _prev: GuestSignupState,
  formData: FormData,
): Promise<GuestSignupState> {
  const raw = formData.get("username");
  const username = typeof raw === "string" ? raw.trim() : "";
  if (!username) return { ok: false, error: "Username is required" };

  const ip = getClientIpFromHeaders(await headers());
  if (!checkRateLimit(`guest:${ip}`, 10, 60_000)) {
    return { ok: false, error: "Too many requests, try again in a minute." };
  }

  const trimmed = username.slice(0, 32);
  const userId = randomUUID();
  await upsertUser(userId, trimmed);

  const session = await getSession();
  session.userId = userId;
  session.username = trimmed;
  await session.save();

  return { ok: true, username: trimmed };
}

export async function signOut(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
