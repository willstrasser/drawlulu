/**
 * Neon Management API helpers for ephemeral test branches.
 *
 * Accepts either IDs or names for NEON_PROJECT_ID and NEON_PARENT_BRANCH_ID —
 * it resolves names to IDs automatically by listing the available projects /
 * branches.  This avoids having to look up opaque IDs in the Neon console.
 */

const NEON_API_BASE = "https://console.neon.tech/api/v2";

interface NeonProject {
  id: string;
  name: string;
}

interface NeonBranch {
  id: string;
  name: string;
}

interface NeonCreateBranchResponse {
  branch: { id: string; name: string };
  operations: Array<{ id: string; status: string }>;
  endpoints: Array<{ id: string; host: string; type: string }>;
  roles: Array<{ name: string; authentication_method: string }>;
  databases: Array<{ name: string; owner_name: string }>;
  // Present for personal accounts; absent for Vercel/org-managed projects.
  connection_uris?: Array<{
    connection_uri: string;
    connection_parameters: {
      database: string;
      role: string;
      host: string;
      pooler_host: string;
    };
  }>;
}

interface NeonOperationResponse {
  operation: {
    id: string;
    status: "running" | "finished" | "failed" | "scheduling";
  };
}

function neonHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Resolve a project name or ID to a project ID.
 *
 * Neon project IDs look like "royal-unit-71066468" (two words + 8 hex chars).
 * If the value matches that pattern it is used directly (no API call).
 *
 * Otherwise we look it up by name.  Projects can live under a personal account
 * or under a Neon organization (e.g. Vercel-managed).  We try the personal
 * endpoint first; if the API requires an org_id we automatically fetch the
 * user's organizations and retry under each one.
 */
async function resolveProjectId(
  nameOrId: string,
  apiKey: string,
): Promise<string> {
  // Fast path: looks like a real project ID already
  if (/^[a-z]+-[a-z]+-[a-z0-9]{8}$/.test(nameOrId)) return nameOrId;

  async function findInList(projects: NeonProject[]): Promise<string | null> {
    const match = projects.find(
      (p) => p.name === nameOrId || p.id === nameOrId,
    );
    return match?.id ?? null;
  }

  // Try personal account projects first
  const personalRes = await fetch(`${NEON_API_BASE}/projects?limit=100`, {
    headers: neonHeaders(apiKey),
  });
  const personalData = (await personalRes.json()) as
    | { projects: NeonProject[] }
    | { message: string };

  if (personalRes.ok && "projects" in personalData) {
    const id = await findInList(personalData.projects);
    if (id) return id;
  }

  // If org_id is required (organization account), discover orgs and search each
  const needsOrg =
    !personalRes.ok ||
    ("message" in personalData && personalData.message?.includes("org_id"));

  if (needsOrg) {
    const orgsRes = await fetch(`${NEON_API_BASE}/users/me/organizations`, {
      headers: neonHeaders(apiKey),
    });
    if (!orgsRes.ok) {
      throw new Error(
        `Could not fetch organizations (${orgsRes.status}): ${await orgsRes.text()}`,
      );
    }
    const orgsData = (await orgsRes.json()) as {
      organizations: { id: string; name: string }[];
    };

    for (const org of orgsData.organizations ?? []) {
      const orgRes = await fetch(
        `${NEON_API_BASE}/projects?org_id=${org.id}&limit=100`,
        { headers: neonHeaders(apiKey) },
      );
      if (!orgRes.ok) continue;
      const orgData = (await orgRes.json()) as { projects: NeonProject[] };
      const id = await findInList(orgData.projects ?? []);
      if (id) return id;
    }
  }

  throw new Error(
    `Neon project "${nameOrId}" not found.\n` +
      `Set NEON_PROJECT_ID to the project ID from the Neon console URL\n` +
      `(Projects → <your project> → Settings → General)`,
  );
}

/**
 * Resolve a branch name or ID to a branch ID within a project.
 *
 * Neon branch IDs start with "br-".  If the provided string doesn't look like
 * an ID we list the project's branches and find one by name.
 */
async function resolveBranchId(
  projectId: string,
  nameOrId: string,
  apiKey: string,
): Promise<string> {
  if (nameOrId.startsWith("br-")) return nameOrId;

  const res = await fetch(`${NEON_API_BASE}/projects/${projectId}/branches`, {
    headers: neonHeaders(apiKey),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to list branches for project ${projectId} (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { branches: NeonBranch[] };
  const match = data.branches?.find(
    (b) => b.name === nameOrId || b.id === nameOrId,
  );
  if (!match) {
    const names = data.branches?.map((b) => `"${b.name}" (${b.id})`).join(", ");
    throw new Error(
      `Neon branch "${nameOrId}" not found in project "${projectId}".\n` +
        `Available branches: ${names || "(none)"}\n` +
        `Set NEON_PARENT_BRANCH_ID to one of the IDs or names above.`,
    );
  }
  return match.id;
}

/** Poll until all branch operations have finished (or throw if any fail). */
async function waitForOperations(
  projectId: string,
  operationIds: string[],
  apiKey: string,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  for (const opId of operationIds) {
    while (Date.now() < deadline) {
      const res = await fetch(
        `${NEON_API_BASE}/projects/${projectId}/operations/${opId}`,
        { headers: neonHeaders(apiKey) },
      );
      const data = (await res.json()) as NeonOperationResponse;
      const { status } = data.operation;

      if (status === "finished") break;
      if (status === "failed") throw new Error(`Neon operation ${opId} failed`);
      await new Promise((r) => setTimeout(r, 400));
    }
  }
}

/**
 * Create a new Neon branch for a test run.
 * Accepts project names or IDs and branch names or IDs — resolves automatically.
 */
export async function createTestBranch(name: string): Promise<{
  branchId: string;
  connectionUri: string;
}> {
  const apiKey = process.env.NEON_API_KEY!;
  const rawProjectId = process.env.NEON_PROJECT_ID!;
  const rawParentBranchId = process.env.NEON_PARENT_BRANCH_ID!;

  // Resolve names → IDs
  const projectId = await resolveProjectId(rawProjectId, apiKey);
  const parentBranchId = await resolveBranchId(
    projectId,
    rawParentBranchId,
    apiKey,
  );

  // Auto-expire the branch after 2 h — safety net if globalTeardown never runs
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const body = {
    endpoints: [{ type: "read_write" }],
    branch: {
      parent_id: parentBranchId,
      name,
      expires_at: expiresAt,
    },
  };

  const res = await fetch(`${NEON_API_BASE}/projects/${projectId}/branches`, {
    method: "POST",
    headers: neonHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Neon branch creation failed (${res.status}): ${await res.text()}`,
    );
  }

  const data = (await res.json()) as NeonCreateBranchResponse;

  const opIds = data.operations.map((o) => o.id);
  await waitForOperations(projectId, opIds, apiKey);

  // Prefer the connection_uris field from the create response (personal accounts).
  // For Vercel/org-managed projects it is absent — fetch it via the dedicated
  // connection_uri endpoint instead.
  let uri = data.connection_uris?.[0]?.connection_uri;

  if (!uri) {
    // Use the database owner role (full access), falling back to neondb_owner.
    // We specifically avoid other password roles like "authenticator" which
    // typically have restricted permissions set by Supabase/Vercel conventions.
    const database = data.databases?.[0]?.name ?? "neondb";
    const role = data.databases?.[0]?.owner_name ?? "neondb_owner";
    const branchId = data.branch.id;

    const connRes = await fetch(
      `${NEON_API_BASE}/projects/${projectId}/connection_uri` +
        `?branch_id=${branchId}&role_name=${role}&database_name=${database}`,
      { headers: neonHeaders(apiKey) },
    );
    if (!connRes.ok) {
      throw new Error(
        `Failed to fetch connection URI (${connRes.status}): ${await connRes.text()}`,
      );
    }
    const connData = (await connRes.json()) as { uri: string };
    uri = connData.uri;
  }

  if (!uri) {
    throw new Error(
      "Could not obtain a connection URI for the new Neon branch",
    );
  }

  const connectionUri = uri.includes("sslmode")
    ? uri
    : `${uri}?sslmode=require`;

  return { branchId: data.branch.id, connectionUri };
}

/**
 * Delete a Neon branch by ID.  Silently ignores 404s.
 */
export async function deleteTestBranch(branchId: string): Promise<void> {
  const apiKey = process.env.NEON_API_KEY;
  const rawProjectId = process.env.NEON_PROJECT_ID;

  if (!apiKey || !rawProjectId || !branchId) return;

  // For teardown we need the resolved project ID too
  const projectId = await resolveProjectId(rawProjectId, apiKey);

  const res = await fetch(
    `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}`,
    {
      method: "DELETE",
      headers: neonHeaders(apiKey),
    },
  );

  if (!res.ok && res.status !== 404) {
    console.error(
      `Warning: failed to delete Neon branch ${branchId}: ${await res.text()}`,
    );
  }
}

/** True when all three required Neon env vars are present and non-placeholder. */
export function neonBranchingEnabled(): boolean {
  const { NEON_API_KEY, NEON_PROJECT_ID, NEON_PARENT_BRANCH_ID } = process.env;
  return Boolean(
    NEON_API_KEY &&
    !NEON_API_KEY.includes("REPLACE_ME") &&
    NEON_PROJECT_ID &&
    !NEON_PROJECT_ID.includes("REPLACE_ME") &&
    NEON_PARENT_BRANCH_ID &&
    !NEON_PARENT_BRANCH_ID.includes("REPLACE_ME"),
  );
}
