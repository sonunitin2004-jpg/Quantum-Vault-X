import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { localDb } from "../lib/localDb";
import { NavigateFn } from "../types/navigation";

import GlassCard from "../components/GlassCard";
import GlassInput from "../components/GlassInput";
import GlassButton from "../components/GlassButton";

import { Brain, Lock } from "lucide-react";

interface NeuralPasswordSetupProps {
  onNavigate: NavigateFn;
}

export default function NeuralPasswordSetup({
  onNavigate,
}: NeuralPasswordSetupProps) {
  const { user, setNeuralPassword } = useAuth();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  /* ───────── HARD AUTH GUARD ───────── */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Session expired. Please sign in again.
      </div>
    );
  }

  /* ───────── SUBMIT HANDLER ───────── */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Neural password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // ⚠ TEMP HASH — will be replaced by Argon2 / PQC later
      const passwordHash = btoa(password);

      await localDb.saveNeuralPassword(user.id, passwordHash);

      setNeuralPassword(password);
      onNavigate("biometric-setup");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save neural password");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 mb-4">
            <Brain className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
            Create Neural Password
          </h1>

          <p className="text-gray-300">
            This protects your Quantum Vault
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassInput
            type="password"
            label="Neural Password"
            placeholder="Enter neural password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
          />

          <GlassInput
            type="password"
            label="Confirm Neural Password"
            placeholder="Confirm neural password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <GlassButton type="submit" disabled={loading} className="w-full">
            {loading ? "Securing..." : "Continue"}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}

