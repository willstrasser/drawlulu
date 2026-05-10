import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth boundary so we can exercise unauthenticated paths without
// touching the database. DB-backed cases (game-not-found, host/player
// policy enforcement) are covered by the E2E suite where a real Neon
// branch is available.
vi.mock("@/lib/get-user", () => ({
  getUser: vi.fn(),
}));

import { getUser } from "@/lib/get-user";
import { withGameContext } from "./with-game-context";

const mockedGetUser = vi.mocked(getUser);

function makeRequest(): Request {
  return new Request("http://test/api/games/ABCDEF/whatever", {
    method: "POST",
  });
}

function makeContext(code = "ABCDEF") {
  return { params: Promise.resolve({ code }) };
}

describe("withGameContext (auth boundary)", () => {
  beforeEach(() => {
    mockedGetUser.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("short-circuits with 401 when no session is present and never invokes the handler", async () => {
    mockedGetUser.mockResolvedValueOnce(null);
    const handler = vi.fn();
    const route = withGameContext({}, handler);

    const res = await route(makeRequest(), makeContext());
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});
