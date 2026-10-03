import "dotenv/config";

const email = process.argv.slice(2).find((argument) => argument !== "--");
if (!email) throw new Error("Usage : tsx server/scripts/send-password-reset-email.ts adresse@email.com");

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
if (!apiKey) throw new Error("EXPO_PUBLIC_FIREBASE_API_KEY manquant");

const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`;

fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ requestType: "PASSWORD_RESET", email: email.trim().toLowerCase() }),
})
  .then(async (response) => {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Firebase a refusé l’e-mail de réinitialisation : ${body}`);
    }
    process.stdout.write(JSON.stringify({ email: email.trim().toLowerCase(), sent: true }) + "\n");
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Envoi impossible"}\n`);
    process.exitCode = 1;
  });
