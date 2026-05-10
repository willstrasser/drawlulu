import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseBody } from "./zod";

function makeJsonRequest(body: unknown): Request {
  return new Request("http://test/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const schema = z.object({
  promptId: z.string().uuid(),
  promptText: z.string().min(1).max(1000),
});

describe("parseBody", () => {
  it("returns ok=true with the parsed data on a valid payload", async () => {
    const req = makeJsonRequest({
      promptId: "11111111-1111-4111-9111-111111111111",
      promptText: "a llama at the beach",
    });
    const result = await parseBody(req, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.promptText).toBe("a llama at the beach");
    }
  });

  it("returns a 400 Response when the body is not valid JSON", async () => {
    const req = makeJsonRequest("{ not json");
    const result = await parseBody(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid JSON");
    }
  });

  it("returns a 400 Response with details when the schema rejects the payload", async () => {
    const req = makeJsonRequest({ promptId: "not-a-uuid", promptText: "" });
    const result = await parseBody(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid request");
      expect(body.details).toBeDefined();
    }
  });
});
