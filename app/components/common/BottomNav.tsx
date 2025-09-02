"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Code2, Table } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/editor", label: "Editor", icon: Code2 },
  { href: "/schema", label: "Schema", icon: Table },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-green-700/50">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive
                  ? "text-green-400"
                  : "text-slate-400 hover:text-green-300"
              }`}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
