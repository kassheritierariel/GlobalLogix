import { setFirebaseUserPassword } from "../firebase-admin";

const email = process.argv.slice(2).find((argument) => argument !== "--");
const password = process.env.GLOBALLOGIX_SUPER_ADMIN_TEMP_PASSWORD;

if (!email) throw new Error("Usage : tsx server/scripts/set-super-admin-password.ts adresse@email.com");
if (!password) throw new Error("GLOBALLOGIX_SUPER_ADMIN_TEMP_PASSWORD manquant");

setFirebaseUserPassword({ email, password })
  .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Mise à jour impossible"}\n`);
    process.exitCode = 1;
  });
