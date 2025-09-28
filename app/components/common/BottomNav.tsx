"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Code2, Table } from "lucide-react";

// Create the nav items
const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/editor", label: "Editor", icon: Code2 },
  { href: "/schema", label: "Schema", icon: Table },
];

export default function BottomNav() {
  // Get the pathname from the use pathname hook
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] border-t border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
      <div className="flex justify-around items-center py-3 px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          // Get the is active state by comparing the pathname to the href
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? "text-cyan-100 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : "text-purple-300 hover:text-cyan-100 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-500/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)]"
              }`}
            >
              <Icon 
                className={`w-6 h-6 transition-all duration-300 ${
                  isActive 
                    ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                    : "group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                }`} 
                aria-hidden="true" 
              />
              <span className={`text-xs font-medium tracking-wider ${
                isActive ? "text-cyan-200" : "group-hover:text-cyan-200"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
