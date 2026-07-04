import { forwardRef } from 'react';

interface GlassInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  name?: string;
  disabled?: boolean;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      type = 'text',
      placeholder,
      value,
      onChange,
      className = '',
      label,
      icon,
      name,
      disabled = false,
    },
    ref
  ) => {
    return (
      <div className="w-full relative">
        {label && (
          <label className="block mb-2 text-sm font-medium text-cyan-300 tracking-wide">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            className={`
              w-full
              h-12
              ${icon ? 'pl-12 pr-4' : 'px-4'}
              rounded-xl
              bg-white/10
              backdrop-blur-xl
              border
              border-cyan-500/30
              text-white
              placeholder:text-gray-400
              focus:outline-none
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-400/40
              transition-all
              duration-300
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${className}
            `}
          />
        </div>
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export default GlassInput;

