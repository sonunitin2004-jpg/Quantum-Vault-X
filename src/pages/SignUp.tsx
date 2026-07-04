import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NavigateFn } from "../types/navigation";

import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import GlassInput from "../components/GlassInput";

import { Mail, Lock } from "lucide-react";

interface SignUpProps {
  onNavigate: NavigateFn;
}

export default function SignUp({ onNavigate }: SignUpProps) {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await signUp(email, password);
      setMessage("Check your email to confirm sign up");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <ParticleBackground />

      <GlassCard className="w-full max-w-md p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Create Quantum Account
        </h1>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-sm">
            {message}
          </div>
        )}

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
            placeholder="Create quantum password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
          />

          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Initializing Quantum Key…" : "Create Account"}
          </GlassButton>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have access?{" "}
          <button
            onClick={() => onNavigate("signin")}
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            Sign In
          </button>
        </div>
      </GlassCard>
    </div>
  );
}







