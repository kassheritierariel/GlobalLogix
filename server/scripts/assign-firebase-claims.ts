import { setGlobalLogixClaims, type GlobalLogixRole } from "../firebase-admin";

const validRoles: GlobalLogixRole[] = ["super_admin", "agency_admin", "staff", "viewer"];
const [uid, roleArgument, agencyArgument] = process.argv.slice(2);
const role = roleArgument as GlobalLogixRole | undefined;
const agencyId = agencyArgument || null;

if (!uid || !role || !validRoles.includes(role)) {
  throw new Error("Usage : tsx server/scripts/assign-firebase-claims.ts <firebaseUid> <super_admin|agency_admin|staff|viewer> [agencyId]");
}

setGlobalLogixClaims({ uid, role, agencyId })
  .then((claims) => console.log(JSON.stringify({ uid, claims }, null, 2)))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
