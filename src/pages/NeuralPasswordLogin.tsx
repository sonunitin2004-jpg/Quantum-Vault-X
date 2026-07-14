import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { localDb } from "../lib/localDb";
import { NavigateFn } from "../types/navigation";

import GlassCard from "../components/GlassCard";
import GlassInput from "../components/GlassInput";
import GlassButton from "../components/GlassButton";

import { Brain, Lock } from "lucide-react";

interface Props {
  onNavigate: NavigateFn;
}

export default function NeuralPasswordLogin({ onNavigate }: Props) {
  const { user, setNeuralPassword: setContextNeuralPassword } = useAuth();

  const [neuralPassword, setNeuralPassword] = useState<string>("");
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

    if (!neuralPassword) {
      setError("Please enter your neural password");
      return;
    }

    setLoading(true);

    try {
      // ⚠ TEMP HASH — same method as setup
      const hashedPassword = btoa(neuralPassword);

      const data = await localDb.getNeuralPassword(user.id);

      if (!data || !data.password_hash) {
        throw new Error("Neural password not found. Please set it again.");
      }

      if (data.password_hash !== hashedPassword) {
        throw new Error("Invalid neural password");
      }

      setContextNeuralPassword(neuralPassword);
      onNavigate("biometric-login");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to verify neural password");
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
            Neural Password
          </h1>

          <p className="text-gray-300">
            Enter your neural password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassInput
            type="password"
            label="Neural Password"
            placeholder="Enter your neural password"
            value={neuralPassword}
            onChange={(e) => setNeuralPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <GlassButton type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Continue to Biometric"}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}






