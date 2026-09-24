import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Reusable Minimal Premium Button for EXHALE:
 * Pill silhouette, thin starlight blue border (#6B7BFF), dark translucent interior (#0B1B3D),
 * soft lavender glow on hover, smooth arrow movement, and accessible disabled state.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, icon, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`group relative inline-flex items-center justify-center gap-2.5 min-h-[44px] px-8 sm:px-10 py-2.5 sm:py-3 rounded-full
          border border-[#6b7bff]/35 bg-[#0a122c]/35 text-[#e6e6ff] backdrop-blur-md
          font-sans text-xs tracking-cosmic uppercase transition-all duration-500 ease-out
          shadow-[0_0_24px_rgba(107,123,255,0.16),inset_0_0_12px_rgba(167,139,250,0.06)]
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#a78bfa]/60 
          focus-visible:ring-offset-2 focus-visible:ring-offset-[#030611] select-none touch-manipulation
          ${
            disabled
              ? 'opacity-40 cursor-not-allowed pointer-events-none'
              : 'hover:border-[#a78bfa]/75 hover:bg-[#10183d]/55 hover:shadow-[0_0_32px_rgba(167,139,250,0.32),0_0_55px_rgba(107,123,255,0.20),inset_0_0_16px_rgba(167,139,250,0.14)] hover:text-white active:scale-[0.97]'
          } ${className}`}
        {...props}
      >
        <span className="font-light tracking-[0.28em] pl-[0.28em]">{children}</span>
        {icon && (
          <span
            className={`transition-all duration-500 ease-out text-[#a78bfa]/80 ${
              !disabled ? 'group-hover:translate-x-1.5 group-hover:text-white' : ''
            }`}
          >
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
