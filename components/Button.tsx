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
  // Base styles: rounded corners, font, transition effects
  const baseStyles = "px-6 py-3 rounded-2xl font-bold font-['Cairo'] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95";
  
  // Color variants matching the Islamic Theme images
  const variants = {
    // Primary: Dark Olive Green (Zaytuni) - Used for main actions
    primary: "bg-gradient-to-r from-[#556b2f] to-[#3f4f24] text-[#f4f1ea] border border-[#3f4f24]",
    
    // Secondary: Golden - Used for additions/highlights
    secondary: "bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-white border border-[#aa8c2c]",
    
    // Danger: Soft Red - For delete actions
    danger: "bg-gradient-to-r from-red-500 to-red-700 text-white",
    
    // Outline: Transparent with Olive border
    outline: "bg-transparent border-2 border-[#556b2f] text-[#3f4f24] hover:bg-[#556b2f] hover:text-[#f4f1ea]"
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