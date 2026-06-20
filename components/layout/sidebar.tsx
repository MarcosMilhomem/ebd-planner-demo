"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Início", papeis: ["ADMIN_GERAL", "GESTOR_SUBSEDE", "PASTOR_CONGREGACAO", "PROFESSOR"] },
  { href: "/dashboard/subsedes", label: "Subsedes", papeis: ["ADMIN_GERAL"] },
  { href: "/dashboard/congregacoes", label: "Congregações", papeis: ["ADMIN_GERAL", "GESTOR_SUBSEDE"] },
  { href: "/dashboard/turmas", label: "Turmas", papeis: ["ADMIN_GERAL", "GESTOR_SUBSEDE", "PASTOR_CONGREGACAO", "PROFESSOR"] },
  { href: "/dashboard/alunos", label: "Alunos", papeis: ["ADMIN_GERAL", "GESTOR_SUBSEDE", "PASTOR_CONGREGACAO", "PROFESSOR"] },
  { href: "/dashboard/usuarios", label: "Usuários", papeis: ["ADMIN_GERAL", "GESTOR_SUBSEDE"] },
  { href: "/dashboard/frequencia", label: "Frequência", papeis: ["ADMIN_GERAL", "GESTOR_SUBSEDE", "PASTOR_CONGREGACAO", "PROFESSOR"] },
];

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const links = NAV.filter((n) => n.papeis.includes(user.papel));

  return (
    <aside className="w-56 min-h-screen bg-slate-800 text-slate-100 flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-slate-700">
        <Image src="/Logo-white.png" alt="EBD Planner" width={36} height={36} />
        <span className="font-bold text-sm">EBD Planner</span>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === link.href
                ? "bg-slate-600 text-white"
                : "hover:bg-slate-700 text-slate-300"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 text-xs">
        <p className="text-slate-400 truncate">{user.nome}</p>
        <p className="text-slate-500 truncate">{PAPEL_LABEL[user.papel]}</p>
        <button
          onClick={logout}
          className="mt-2 text-slate-400 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

const PAPEL_LABEL: Record<string, string> = {
  ADMIN_GERAL: "Admin Geral",
  GESTOR_SUBSEDE: "Gestor de Subsede",
  PASTOR_CONGREGACAO: "Pastor / Líder",
  PROFESSOR: "Professor",
};
