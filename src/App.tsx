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
import { supabase } from "./lib/supabase";

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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

















