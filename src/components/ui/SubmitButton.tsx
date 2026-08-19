"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ 
  text = "Salvar", 
  loadingText = "Salvando..." 
}: { 
  text?: string; 
  loadingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-maitre-gold hover:bg-maitre-gold-hover disabled:opacity-70 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg font-semibold shadow-md transition-all active:scale-95 flex items-center justify-center min-w-[160px]"
    >
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin mr-2" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
}
