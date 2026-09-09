import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { haptic } from "@/lib/haptics";
import { toFirebaseAuthMessage } from "@/lib/firebase-auth-errors";
import { getFirebaseAuth, isFirebaseConfigured, signInWithGoogleAccount } from "@/lib/firebase";
import type { MobileUser } from "@/lib/types";

type AuthContextValue = {
  user: MobileUser | null;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsRestoring(false);
      return;
    }
    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }
        const token = await firebaseUser.getIdTokenResult();
        const role = typeof token.claims.role === "string" ? token.claims.role : "viewer";
        const agencyId = typeof token.claims.agencyId === "string" ? token.claims.agencyId : null;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? "Utilisateur GlobalLogix",
          role: ["super_admin", "agency_admin", "staff", "viewer", "client"].includes(role) ? role as MobileUser["role"] : "viewer",
          agencyId,
        });
      } finally {
        setIsRestoring(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (!isFirebaseConfigured) throw new Error("Firebase n’est pas configuré pour cette version.");
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      haptic.success();
    } catch (error) {
      haptic.error();
      throw new Error(toFirebaseAuthMessage(error));
    }
  };

  const loginWithGoogle = async () => {
    try { await signInWithGoogleAccount(); haptic.success(); }
    catch (error) { haptic.error(); throw new Error(toFirebaseAuthMessage(error)); }
  };

  const logout = async () => {
    if (isFirebaseConfigured) await signOut(getFirebaseAuth());
    setUser(null);
    haptic.medium();
  };

  const refreshClaims = async () => {
    const firebaseUser = getFirebaseAuth().currentUser;
    if (!firebaseUser) return;
    await firebaseUser.getIdToken(true);
  };

  const value = useMemo(() => ({ user, isRestoring, login, loginWithGoogle, logout, refreshClaims }), [user, isRestoring]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider.");
  }
  return context;
}
