"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-5 py-2.5 rounded-xl font-extrabold shadow-md hover:brightness-105 transition-all text-xs cursor-pointer active:scale-95"
    >
      <Printer size={16} />
      <span>Imprimir / Salvar em PDF</span>
    </button>
  );
}
