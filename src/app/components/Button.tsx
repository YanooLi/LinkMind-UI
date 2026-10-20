interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = "px-6 py-3 rounded-lg transition-all duration-200 font-['Inter',sans-serif] font-medium text-[16px] leading-[24px]";

  const variantStyles = {
    primary: "bg-[#2E4BC8] text-white hover:bg-[#243D9F]",
    secondary: "bg-white text-[#2E4BC8] border-2 border-[#2E4BC8] hover:bg-[#F0F2FF]",
    outline: "bg-transparent text-[#2E4BC8] border border-[#2E4BC8] hover:bg-[#F0F2FF]"
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
