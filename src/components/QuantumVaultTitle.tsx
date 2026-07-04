interface Props {
  className?: string;
}

export default function QuantumVaultTitle({ className = "" }: Props) {
  return (
    <span className={className}>
      <span className="text-cyan-400">Quantum Vault </span>

      <span
        className="
          text-transparent bg-clip-text
          bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500
          font-extrabold
          tracking-widest
          drop-shadow-[0_0_14px_rgba(56,189,248,0.9)]
        "
        style={{
          fontFamily: "'Orbitron', 'Rajdhani', 'Share Tech Mono', monospace",
        }}
      >
        X
      </span>
    </span>
  );
}

