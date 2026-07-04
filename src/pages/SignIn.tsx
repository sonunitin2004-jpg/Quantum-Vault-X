import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NavigateFn } from "../types/navigation";

import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import GlassInput from "../components/GlassInput";

import { Mail, Lock } from "lucide-react";
import QuantumVaultTitle from "../components/QuantumVaultTitle";

interface SignInProps {
  onNavigate: NavigateFn;
}

export default function SignIn({ onNavigate }: SignInProps) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <ParticleBackground />

      <GlassCard className="w-full max-w-md p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-6">
  <QuantumVaultTitle /> 
</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <GlassInput
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />

          <GlassInput
            type="password"
            label="Quantum Password"
            placeholder="Enter quantum password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
          />

          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Authenticating…" : "Quantum Login"}
          </GlassButton>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <button
            onClick={() => onNavigate("signup")}
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            Register
          </button>
        </div>
      </GlassCard>
    </div>
  );
}







