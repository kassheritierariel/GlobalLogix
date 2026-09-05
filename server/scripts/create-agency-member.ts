import { createAgencyMember, requestFirebasePasswordReset, type AgencyMemberRole } from "../firebase-admin";

const [roleArgument, email, agencyId] = process.argv.slice(2).filter((argument) => argument !== "--");
const role = roleArgument as AgencyMemberRole | undefined;

if (!role || !email || !agencyId || !["staff", "viewer"].includes(role)) {
  throw new Error("Usage : pnpm firebase:bootstrap-agency-member -- <staff|viewer> <email> <agencyId>");
}

createAgencyMember({ role, email, agencyId })
  .then(async (member) => {
    const invitation = await requestFirebasePasswordReset(member.email);
    process.stdout.write(`${JSON.stringify({ ...member, invitation })}\n`);
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Création du compte impossible"}\n`);
    process.exitCode = 1;
  });
