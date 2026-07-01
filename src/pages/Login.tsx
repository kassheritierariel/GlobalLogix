import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Shield, Lock, Mail, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isClassicLogin, setIsClassicLogin] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Failed to log in:', error);
    }
  };

  const handleClassicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for agency admin
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#020617] flex relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] -mr-96 -mt-96 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[100px] -ml-64 -mb-64 rounded-full" />

      <div className="hidden lg:flex flex-1 flex-col justify-center px-24 relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 ring-4 ring-blue-600/10">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <span className="text-4xl font-black italic tracking-tighter uppercase text-white">GlobalLogix</span>
        </div>
        
        <h1 className="text-7xl font-black text-white leading-none tracking-tighter italic uppercase mb-8">
          Next-Gen <br /> Logistics <br /> Sovereignty.
        </h1>
        <p className="text-slate-400 text-lg max-w-md leading-relaxed">
          The ultimate terminal for high-fidelity cargo management, global synchronization, and operational excellence.
        </p>

        <div className="mt-16 grid grid-cols-2 gap-8 max-w-lg">
          <div className="space-y-2">
            <Shield className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocol X</h3>
            <p className="text-xs text-slate-500">Mil-spec encryption for every manifest.</p>
          </div>
          <div className="space-y-2">
            <Globe className="w-6 h-6 text-indigo-500 mb-2" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Geo-Sync</h3>
            <p className="text-xs text-slate-500">Real-time satellite vectoring for transit tracking.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-[600px] flex items-center justify-center p-8 relative z-10 bg-slate-950/50 backdrop-blur-3xl border-l border-white/5">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-3">Authentification</h2>
            <p className="text-slate-500 text-sm">Veuillez vous identifier pour accéder au terminal.</p>
          </div>

          <div className="space-y-6 flex flex-col items-center">
            
            {isClassicLogin ? (
              <form onSubmit={handleClassicSubmit} className="w-full space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <User className="w-3 h-3" /> Identifiant
                    </label>
                    <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="admin_agence" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Lock className="w-3 h-3" /> Mot de passe
                    </label>
                    <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="••••••••" />
                 </div>
                 <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-colors mt-6 flex items-center justify-center gap-2"
                 >
                   Connexion <ChevronRight className="w-4 h-4" />
                 </button>
                 <button 
                   type="button"
                   onClick={() => setIsClassicLogin(false)}
                   className="w-full text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest mt-4"
                 >
                   Retour à Google Workspace
                 </button>
              </form>
            ) : (
              <>
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-6 flex items-center justify-center gap-4 w-full bg-white text-slate-900 font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <span>{loading ? 'Initialisation...' : 'Sign in with Google'}</span>
                </button>
                <button 
                   onClick={() => setIsClassicLogin(true)}
                   className="w-full text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest mt-4"
                >
                   Connexion Administrateur Agence
                </button>
              </>
            )}
          </div>

          <p className="mt-12 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
            &copy; 2026 GlobalLogix Infrastructure Systems
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

