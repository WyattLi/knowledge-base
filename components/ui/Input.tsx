import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary
        focus:outline-none focus:border-nebula-purple/50 transition-colors ${className}`}
      {...props}
    />
  );
}
