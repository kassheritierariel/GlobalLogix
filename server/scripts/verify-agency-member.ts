import { getAgencyMemberByEmail } from "../firebase-admin";

const [email] = process.argv.slice(2).filter((argument) => argument !== "--");

if (!email) throw new Error("Usage : pnpm firebase:verify-agency-member -- <email>");

getAgencyMemberByEmail(email)
  .then((member) => process.stdout.write(`${JSON.stringify(member)}\n`))
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Vérification impossible"}\n`);
    process.exitCode = 1;
  });
