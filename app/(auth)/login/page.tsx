"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const USUARIOS_DEMO = [
  {
    label: "Admin Geral",
    descricao: "Vê e gerencia toda a Sede",
    email: "admin.demo@ebdplanner.app",
    cor: "bg-purple-600 hover:bg-purple-700",
  },
  {
    label: "Gestor — Subsede Norte",
    descricao: "Gerencia congregações da Subsede Norte",
    email: "gestor.subsede-norte@ebdplanner.app",
    cor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    label: "Gestor — Subsede Sul",
    descricao: "Gerencia congregações da Subsede Sul",
    email: "gestor.subsede-sul@ebdplanner.app",
    cor: "bg-blue-500 hover:bg-blue-600",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarComo(email: string) {
    setLoading(email);
    setErro(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao fazer login");
      }
      router.push("/dashboard");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        {/* Logo + título */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/Logo-purple.png" alt="EBD Planner" width={72} height={72} priority />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">EBD Planner</h1>
            <p className="text-sm text-slate-500 mt-1">Demo de Portfólio</p>
          </div>
        </div>

        {/* Aviso de demo */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>Ambiente de demonstração.</strong> Todos os dados são fictícios.
          Escolha um papel para explorar o sistema:
        </div>

        {/* Botões de login rápido */}
        <div className="flex flex-col gap-3">
          {USUARIOS_DEMO.map((u) => (
            <button
              key={u.email}
              onClick={() => entrarComo(u.email)}
              disabled={loading !== null}
              className={`${u.cor} text-white rounded-xl px-4 py-3 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <p className="font-semibold text-sm">
                {loading === u.email ? "Entrando…" : `Entrar como ${u.label}`}
              </p>
              <p className="text-xs opacity-80 mt-0.5">{u.descricao}</p>
            </button>
          ))}

          {/* Professor — e-mail gerado dinamicamente pelo seed */}
          <ProfessorLoginButton loading={loading} onLogin={entrarComo} />
        </div>

        {erro && (
          <p className="text-red-600 text-sm text-center">{erro}</p>
        )}

        <p className="text-xs text-slate-400 text-center">
          Dados resetados automaticamente todo dia às 03h UTC.
        </p>
      </div>
    </div>
  );
}

function ProfessorLoginButton({
  loading,
  onLogin,
}: {
  loading: string | null;
  onLogin: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 text-left transition-colors"
      >
        <p className="font-semibold text-sm">Entrar como Professor</p>
        <p className="text-xs opacity-80 mt-0.5">Informe o e-mail gerado pelo seed</p>
      </button>
    );
  }

  return (
    <div className="border border-green-300 rounded-xl p-3 flex flex-col gap-2">
      <p className="text-xs text-slate-600">
        E-mail do professor (padrão: <code>professor.&lt;turmaId&gt;@ebdplanner.app</code>)
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="professor.xxx@ebdplanner.app"
        className="border rounded-lg px-3 py-2 text-sm w-full"
      />
      <button
        onClick={() => onLogin(email)}
        disabled={!email || loading !== null}
        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading === email ? "Entrando…" : "Entrar"}
      </button>
    </div>
  );
}
