import { getFirebaseIdToken } from "@/lib/firebase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export async function submitAgencyRegistration(input: { agencyName: string; publicEmail: string; city: string }) {
  if (!API_BASE_URL) throw new Error("Service d’inscription indisponible dans cette version.");
  const token = await getFirebaseIdToken(true);
  if (!token) throw new Error("Connectez-vous avec Google avant d’envoyer votre demande.");
  const response = await fetch(`${API_BASE_URL}/api/agency-registration-request`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const payload = await response.json().catch(() => null) as { error?: string; submitted?: true; deduplicated?: boolean; request?: { id: string; status: "pending"; createdAt: string } } | null;
  if (!response.ok) throw new Error(payload?.error ?? "Envoi de la demande impossible.");
  if (!payload?.request || !payload.submitted) throw new Error("Réponse d’inscription incomplète.");
  return { submitted: true as const, deduplicated: payload.deduplicated === true, request: payload.request };
}
