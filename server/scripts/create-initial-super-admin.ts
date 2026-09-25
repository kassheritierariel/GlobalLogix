import "dotenv/config";

import { createInitialSuperAdmin } from "../firebase-admin";

const email = process.argv.slice(2).find((argument) => argument !== "--");
if (!email) {
  throw new Error("Usage : tsx server/scripts/create-initial-super-admin.ts adresse@email.com");
}

createInitialSuperAdmin(email)
  .then((result: Awaited<ReturnType<typeof createInitialSuperAdmin>>) => process.stdout.write(`${JSON.stringify(result)}\n`))
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Création impossible"}\n`);
    process.exitCode = 1;
  });
