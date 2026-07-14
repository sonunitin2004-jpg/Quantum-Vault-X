import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { localDb } from "../lib/localDb";

import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";

import { Fingerprint } from "lucide-react";
import { NavigateFn } from "../types/navigation";

interface Props {
  onNavigate: NavigateFn;
}

export default function BiometricLogin({ onNavigate }: Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  /* ───────── AUTH GUARD ───────── */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Session expired. Please sign in again.
      </div>
    );
  }

  /* ───────── BIOMETRIC CHECK ───────── */
  useEffect(() => {
    let mounted = true;

    const checkBiometric = async (): Promise<void> => {
      try {
        const data = await localDb.getBiometricStatus(user.id);

        if (!data || !data.enabled) {
          throw new Error("Biometric not enabled");
        }

        // fake biometric scan delay
        setTimeout(() => {
          if (mounted) {
            onNavigate("vault");
          }
        }, 1200);
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Biometric verification failed"
        );
        setLoading(false);
      }
    };

    checkBiometric();

    return () => {
      mounted = false;
    };
  }, [user.id, onNavigate]);

  /* ───────── UI ───────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 animate-fade-in text-center">
        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 mb-6">
          <Fingerprint className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-3">
          Biometric Verification
        </h1>

        {loading && (
          <p className="text-gray-300 mb-6">
            Scanning biometric signature...
          </p>
        )}

        {error && (
          <>
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>

            <GlassButton
              onClick={() => onNavigate("vault")}
              className="w-full"
            >
              Continue
            </GlassButton>
          </>
        )}
      </GlassCard>
    </div>
  );
}





