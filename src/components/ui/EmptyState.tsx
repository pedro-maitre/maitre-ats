"use client";

import React from "react";
import { LucideIcon, Search, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-maitre-gold/10 dark:bg-maitre-gold/20 text-maitre-gold flex items-center justify-center mb-4 ring-8 ring-maitre-gold/5 transition-transform duration-300 hover:scale-105">
        <Icon size={32} aria-hidden="true" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-maitre-gold hover:bg-maitre-gold-hover text-white text-xs font-bold transition-all shadow-md shadow-maitre-gold/20 active:scale-95 cursor-pointer"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
