import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md";
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none glow-border disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-nebula-purple/80 text-white hover:bg-nebula-purple shadow-[0_0_20px_rgba(124,58,237,0.3)]",
    secondary: "glass text-text-primary glass-hover",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-white/5",
  };
  const sizes = { xs: "px-2 py-1.5 text-xs gap-1", sm: "px-3 py-1.5 text-sm gap-1.5", md: "px-4 py-2 text-sm gap-2" };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
