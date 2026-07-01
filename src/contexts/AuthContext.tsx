import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'super_admin',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        };
        setUser(appUser);
        setAccessToken(cachedAccessToken);
      } else {
        if (!isSigningIn) {
          setUser(null);
          setAccessToken(null);
          cachedAccessToken = null;
        }
      }
      if (!isSigningIn) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      isSigningIn = true;
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to get access token from Firebase Auth');
      }

      cachedAccessToken = credential.accessToken;
      setAccessToken(cachedAccessToken);
      
      const appUser: User = {
        uid: result.user.uid,
        email: result.user.email,
        role: 'super_admin',
        displayName: result.user.displayName || result.user.email?.split('@')[0],
      };
      setUser(appUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      isSigningIn = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setAccessToken(null);
    cachedAccessToken = null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
