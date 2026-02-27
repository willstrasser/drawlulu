import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { deleteTestBranch } from "./helpers/neon";
import { BRANCH_ID_FILE } from "./global-setup";

const BRANCH_URL_FILE = path.resolve(process.cwd(), ".neon-branch-url");

export default async function globalTeardown(): Promise<void> {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.test"),
    override: true,
  });

  // Always remove the URL file — it was written by pretest.ts.
  if (fs.existsSync(BRANCH_URL_FILE)) {
    fs.unlinkSync(BRANCH_URL_FILE);
  }

  if (!fs.existsSync(BRANCH_ID_FILE)) {
    // No branch was created (fallback mode or previous teardown already ran).
    return;
  }

  const branchId = fs.readFileSync(BRANCH_ID_FILE, "utf8").trim();
  console.log(`[teardown] Deleting Neon branch ${branchId}…`);

  await deleteTestBranch(branchId);
  fs.unlinkSync(BRANCH_ID_FILE);

  console.log(`[teardown] Branch ${branchId} deleted`);
}
