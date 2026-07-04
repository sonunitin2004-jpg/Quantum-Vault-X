import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";

import { Fingerprint } from "lucide-react";
import { NavigateFn } from "../types/navigation";

interface Props {
  onNavigate: NavigateFn;
}

export default function BiometricSetup({ onNavigate }: Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  /* ───────── AUTH GUARD ───────── */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Session expired. Please sign in again.
      </div>
    );
  }

  /* ───────── ENABLE BIOMETRIC ───────── */
  const enableBiometric = async (): Promise<void> => {
    setError("");
    setLoading(true);

    try {
      const { error: upsertError } = await supabase
        .from("biometric_status")
        .upsert(
          {
            user_id: user.id,
            enabled: true,
          },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        throw upsertError;
      }

      // fake scan delay for realism
      setTimeout(() => {
        onNavigate("vault");
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to enable biometric"
      );
      setLoading(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 animate-fade-in text-center">
        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 mb-6">
          <Fingerprint className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-3">
          Enable Biometric
        </h1>

        <p className="text-gray-300 mb-8">
          Secure your Quantum Vault with biometric protection
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <GlassButton
          onClick={enableBiometric}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Scanning..." : "Enable Biometric"}
        </GlassButton>
      </GlassCard>
    </div>
  );
}





