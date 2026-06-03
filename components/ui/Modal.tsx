"use client";

import { useEffect, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--backdrop)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-xl p-6 w-full max-w-md shadow-[0_0_40px_var(--border-glow)]">
        {title && <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
