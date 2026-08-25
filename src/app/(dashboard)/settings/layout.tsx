import React from "react";
import SettingsNav from "./SettingsNav";

export const metadata = {
  title: "Configurações | Maître Conecta",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto w-full pb-12 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Configurações</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Gerencie suas preferências de perfil e informações da organização.
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-64 shrink-0">
          <SettingsNav />
        </aside>
        
        <main className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 min-h-[500px]">
          {children}
        </main>
      </div>
    </div>
  );
}
