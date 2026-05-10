import type { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "./json";

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: errorResponse("Invalid JSON", 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse("Invalid request", 400, parsed.error.flatten()),
    };
  }
  return { ok: true, data: parsed.data };
}
