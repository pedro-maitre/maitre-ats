"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  text,
  label,
  loadingText,
  loadingLabel,
  className,
}: {
  text?: string;
  label?: string;
  loadingText?: string;
  loadingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  const displayText = label || text || "Salvar";
  const displayLoadingText = loadingLabel || loadingText || "Salvando...";

  const defaultClasses =
    "bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 hover:brightness-105 disabled:opacity-50 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center min-w-[140px]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={className || defaultClasses}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin mr-2" />
          {displayLoadingText}
        </>
      ) : (
        displayText
      )}
    </button>
  );
}
