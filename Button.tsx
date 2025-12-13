import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  ...props
}) => {
  // Base styles including transition and font settings
  const baseStyles = "px-4 py-2 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]";

  // Updated variants to match the Islamic/Parchment Theme
  const variants = {
    // Olive Green (Main Action)
    primary: "bg-[#5c6b48] text-white hover:bg-[#4a563a] active:bg-[#3d4a2e] border border-[#5c6b48]",

    // Gold/Tan (Secondary Action)
    secondary: "bg-[#a89060] text-white hover:bg-[#8f7a50] active:bg-[#7a6840] border border-[#a89060]",

    // Red (Danger/Delete) - Kept red but softer
    danger: "bg-red-500 text-white hover:bg-red-600 border border-red-600 shadow-sm",

    // Outline (Green Border)
    outline: "border-2 border-[#5c6b48] text-[#5c6b48] hover:bg-[#f4f1ea] bg-transparent"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
      ) : children}
    </button>
  );
};