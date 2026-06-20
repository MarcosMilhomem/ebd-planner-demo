"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { Papel } from "@prisma/client";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  subsede?: { nome: string } | null;
  congregacao?: { nome: string } | null;
};

const PAPEL_LABEL: Record<Papel, string> = {
  ADMIN_GERAL: "Admin Geral",
  GESTOR_SUBSEDE: "Gestor de Subsede",
  PASTOR_CONGREGACAO: "Pastor / Líder",
  PROFESSOR: "Professor",
};

const PAPEL_COR: Record<Papel, string> = {
  ADMIN_GERAL: "bg-purple-100 text-purple-700",
  GESTOR_SUBSEDE: "bg-blue-100 text-blue-700",
  PASTOR_CONGREGACAO: "bg-green-100 text-green-700",
  PROFESSOR: "bg-amber-100 text-amber-700",
};

interface Props {
  usuariosIniciais: Usuario[];
  congregacoes: { id: string; nome: string }[];
  subsedes: { id: string; nome: string }[];
  turmas: { id: string; nome: string; congregacao: { nome: string } }[];
  papeisPermitidos: Papel[];
  papelAtual: Papel;
}

export function UsuariosClient({
  usuariosIniciais,
  congregacoes,
  subsedes,
  turmas,
  papeisPermitidos,
  papelAtual,
}: Props) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "", email: "", papel: "" as Papel | "",
    subsedeId: "", congregacaoId: "", turmaId: "",
  });

  const papelSelecionado = form.papel as Papel | "";

  async function criar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as Usuario & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar usuário");
      setUsuarios((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setModalAberto(false);
      setForm({ nome: "", email: "", papel: "", subsedeId: "", congregacaoId: "", turmaId: "" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
        <Button onClick={() => setModalAberto(true)}>+ Novo usuário</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Papel</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Vínculo</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAPEL_COR[u.papel]}`}>
                    {PAPEL_LABEL[u.papel]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.congregacao?.nome ?? u.subsede?.nome ?? "Sede"}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[180px]">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal titulo="Novo Usuário" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <div className="flex flex-col gap-3">
          <Input
            label="Nome completo *"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do usuário"
          />
          <Input
            label="E-mail *"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="usuario@exemplo.com"
          />
          <Select
            label="Papel *"
            value={form.papel}
            onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value as Papel, subsedeId: "", congregacaoId: "", turmaId: "" }))}
            options={papeisPermitidos.map((p) => ({ value: p, label: PAPEL_LABEL[p] }))}
          />

          {papelSelecionado === "GESTOR_SUBSEDE" && subsedes.length > 0 && (
            <Select
              label="Subsede *"
              value={form.subsedeId}
              onChange={(e) => setForm((f) => ({ ...f, subsedeId: e.target.value }))}
              options={subsedes.map((s) => ({ value: s.id, label: s.nome }))}
            />
          )}

          {(papelSelecionado === "PASTOR_CONGREGACAO" || papelSelecionado === "PROFESSOR") && (
            <Select
              label="Congregação *"
              value={form.congregacaoId}
              onChange={(e) => setForm((f) => ({ ...f, congregacaoId: e.target.value }))}
              options={congregacoes.map((c) => ({ value: c.id, label: c.nome }))}
            />
          )}

          {papelSelecionado === "PROFESSOR" && turmas.length > 0 && (
            <Select
              label="Turma (opcional)"
              value={form.turmaId}
              onChange={(e) => setForm((f) => ({ ...f, turmaId: e.target.value }))}
              options={turmas.map((t) => ({
                value: t.id,
                label: `${t.nome} — ${t.congregacao.nome}`,
              }))}
            />
          )}

          {papelAtual !== "ADMIN_GERAL" && (
            <p className="text-xs text-slate-400">
              O e-mail de login rápido será gerado automaticamente com o padrão do sistema.
            </p>
          )}

          {erro && <p className="text-red-600 text-xs">{erro}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={criar} disabled={salvando || !form.nome || !form.email || !form.papel}>
              {salvando ? "Salvando…" : "Criar usuário"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
