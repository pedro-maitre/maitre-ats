"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building, Users } from "lucide-react";
import { clsx } from "clsx";

export default function SettingsNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/settings/profile",
      label: "Meu Perfil",
      icon: User,
    },
    {
      href: "/settings/organization",
      label: "Empresa",
      icon: Building,
    },
    // We can add team management later:
    // {
    //   href: "/settings/team",
    //   label: "Equipe",
    //   icon: Users,
    // }
  ];

  return (
    <nav className="flex flex-col gap-1 w-full bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
              isActive
                ? "bg-maitre-gold/10 text-maitre-gold dark:bg-maitre-gold/20 dark:text-maitre-gold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Icon size={18} className={clsx(isActive ? "text-maitre-gold" : "text-slate-400 dark:text-slate-500")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
