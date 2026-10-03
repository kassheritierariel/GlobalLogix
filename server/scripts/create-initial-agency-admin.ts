import { createInitialAgencyAdmin } from "../firebase-admin";

const argumentsWithoutSeparator = process.argv.slice(2).filter((argument) => argument !== "--");
const [email, agencyId] = argumentsWithoutSeparator;

if (!email || !agencyId) {
  throw new Error("Usage : tsx server/scripts/create-initial-agency-admin.ts adresse@email.com CODE_AGENCE");
}

createInitialAgencyAdmin({ email, agencyId })
  .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Création impossible"}\n`);
    process.exitCode = 1;
  });
