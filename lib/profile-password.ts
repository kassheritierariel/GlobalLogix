export function validatePasswordChange(input: { currentPassword: string; newPassword: string; confirmPassword: string }): string | null {
  if (!input.currentPassword) return "Saisissez votre mot de passe actuel.";
  if (input.newPassword.length < 12) return "Le nouveau mot de passe doit contenir au moins 12 caractères.";
  if (!/[a-z]/.test(input.newPassword) || !/[A-Z]/.test(input.newPassword) || !/\d/.test(input.newPassword) || !/[^A-Za-z0-9]/.test(input.newPassword)) {
    return "Utilisez des majuscules, minuscules, chiffres et un symbole.";
  }
  if (input.newPassword !== input.confirmPassword) return "Les nouveaux mots de passe ne correspondent pas.";
  if (input.currentPassword === input.newPassword) return "Choisissez un nouveau mot de passe différent de l’actuel.";
  return null;
}
