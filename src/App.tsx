import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ParticleBackground from "./components/ParticleBackground";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NeuralPasswordSetup from "./pages/NeuralPasswordSetup";
import NeuralPasswordLogin from "./pages/NeuralPasswordLogin";
import BiometricSetup from "./pages/BiometricSetup";
import BiometricLogin from "./pages/BiometricLogin";
import VaultDashboard from "./pages/VaultDashboard";

import { AppPage } from "./types/appPage";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<AppPage>("signin");
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (loading) return;

    const resolveFlow = async () => {
      // 1️⃣ NOT LOGGED IN
      if (!user) {
        setPage("signin");
        setResolving(false);
        return;
      }

      // 2️⃣ CHECK NEURAL PASSWORD EXISTENCE ONLY
      const { data: neuralData, error } = await supabase
        .from("neural_passwords")
        .select("password_hash")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Neural check error:", error);
        setPage("neural-setup");
        setResolving(false);
        return;
      }

      // 3️⃣ NEURAL NOT SET → SETUP
      if (!neuralData) {
        setPage("neural-setup");
        setResolving(false);
        return;
      }

      // 4️⃣ NEURAL EXISTS → LOGIN REQUIRED (IMPORTANT)
      setPage("neural-login");
      setResolving(false);
    };

    resolveFlow();
  }, [user, loading]);

  if (loading || resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white relative z-10">
        Initializing Quantum Vault…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* BACKGROUND */}
      <ParticleBackground />

      {/* FOREGROUND */}
      <div className="relative z-10 min-h-screen">
        {{
          signin: <SignIn onNavigate={setPage} />,
          signup: <SignUp onNavigate={setPage} />,
          "neural-setup": <NeuralPasswordSetup onNavigate={setPage} />,
          "neural-login": <NeuralPasswordLogin onNavigate={setPage} />,
          "biometric-setup": <BiometricSetup onNavigate={setPage} />,
          "biometric-login": <BiometricLogin onNavigate={setPage} />,
          vault: <VaultDashboard onNavigate={setPage} />,
        }[page]}
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Required</h1>
          <p className="text-gray-300 mb-6 text-sm">
            Supabase environment variables are missing. Please add the following keys to your project's environment variables:
          </p>
          <div className="text-left bg-black/40 p-4 rounded-lg font-mono text-xs text-cyan-400 space-y-2 mb-6">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_ANON_KEY</div>
          </div>
          <p className="text-gray-400 text-xs">
            If deploying on Vercel, set these in the <strong>Environment Variables</strong> tab of your Vercel project settings, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

















