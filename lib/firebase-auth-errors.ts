type FirebaseAuthErrorLike = { code?: unknown; message?: unknown };

export function toFirebaseAuthMessage(error: unknown) {
  const candidate = error as FirebaseAuthErrorLike | null;
  const code = typeof candidate?.code === "string" ? candidate.code : "";

  switch (code) {
    case "auth/unauthorized-domain":
      return "Connexion Google indisponible sur ce domaine. Ajoutez ce domaine aux domaines autorisés dans Firebase Authentication, puis réessayez.";
    case "auth/invalid-email":
      return "Saisissez une adresse e-mail valide, par exemple contact@votreagence.com.";
    case "auth/popup-closed-by-user":
      return "La fenêtre de connexion Google a été fermée avant la fin de l’authentification.";
    case "auth/popup-blocked":
      return "Le navigateur a bloqué la fenêtre Google. Autorisez les fenêtres contextuelles puis réessayez.";
    case "auth/network-request-failed":
      return "La connexion réseau a échoué. Vérifiez Internet puis réessayez.";
    default:
      return typeof candidate?.message === "string" && candidate.message.trim()
        ? candidate.message
        : "Connexion Firebase impossible. Réessayez dans quelques instants.";
  }
}
