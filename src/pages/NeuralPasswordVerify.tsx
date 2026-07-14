import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { localDb } from "../lib/localDb";

import GlassCard from "../components/GlassCard";
import GlassInput from "../components/GlassInput";
import GlassButton from "../components/GlassButton";

import { Brain, Lock } from "lucide-react";

interface NeuralPasswordVerifyProps {
  onNavigate: (page: string) => void;
}

export default function NeuralPasswordVerify({
  onNavigate,
}: NeuralPasswordVerifyProps) {
  const { user } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ───────── HARD GUARD ───────── */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Session expired. Please sign in again.
      </div>
    );
  }

  /* ───────── VERIFY HANDLER ───────── */
  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your neural password");
      return;
    }

    setLoading(true);

    try {
      const data = await localDb.getNeuralPassword(user.id);

      if (!data) {
        throw new Error("Neural password not found");
      }

      const inputHash = btoa(password);

      if (inputHash !== data.password_hash) {
        throw new Error("Invalid neural password");
      }

      // ✅ SUCCESS → move forward
      onNavigate("biometric-verify");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Verification failed");
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
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 mb-4">
            <Brain className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Verify Neural Password
          </h1>

          <p className="text-gray-300">
            Confirm identity to unlock Quantum Vault
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <GlassInput
            type="password"
            label="Neural Password"
            placeholder="Enter neural password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <GlassButton type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Unlock"}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
