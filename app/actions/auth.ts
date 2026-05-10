"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { upsertUser } from "@/lib/ensure-user";
import { getSession } from "@/lib/iron-session";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

import type { GuestSignupState } from "./state";

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

  revalidatePath("/");
  return { ok: true, username: trimmed };
}

export async function signOut(): Promise<void> {
  const session = await getSession();
  session.destroy();
  revalidatePath("/");
}
