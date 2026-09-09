export function isTemporaryPasswordStrong(password: string | undefined): boolean {
  if (!password || password.length < 12) return false;
  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}
