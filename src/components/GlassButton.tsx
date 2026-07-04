import { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export default function GlassButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: GlassButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70',
    secondary: 'backdrop-blur-xl bg-white/10 border border-white/30 text-white hover:bg-white/20',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
