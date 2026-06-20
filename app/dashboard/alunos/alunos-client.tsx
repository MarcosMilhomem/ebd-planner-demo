"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type Aluno = {
  id: string;
  nome: string;
  dataNascimento: Date | string | null;
  turma: { id: string; nome: string };
};

type Turma = { id: string; nome: string; congregacao: { nome: string } };

interface Props {
  alunosIniciais: Aluno[];
  turmas: Turma[];
}

export function AlunosClient({ alunosIniciais, turmas }: Props) {
  const [alunos, setAlunos] = useState(alunosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", dataNascimento: "", turmaId: "" });
  const [filtro, setFiltro] = useState("");

  async function criar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as Aluno & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar aluno");
      setAlunos((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setModalAberto(false);
      setForm({ nome: "", dataNascimento: "", turmaId: "" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSalvando(false);
    }
  }

  const alunosFiltrados = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      a.turma.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Alunos</h1>
        <Button onClick={() => setModalAberto(true)}>+ Novo aluno</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou turma…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Turma</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Nascimento</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
            {alunosFiltrados.map((a) => (
              <tr key={a.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{a.nome}</td>
                <td className="px-4 py-3 text-slate-500">{a.turma.nome}</td>
                <td className="px-4 py-3 text-slate-500">
                  {a.dataNascimento
                    ? new Date(a.dataNascimento).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal titulo="Novo Aluno" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <div className="flex flex-col gap-3">
          <Input
            label="Nome completo *"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do aluno"
          />
          <Select
            label="Turma *"
            value={form.turmaId}
            onChange={(e) => setForm((f) => ({ ...f, turmaId: e.target.value }))}
            options={turmas.map((t) => ({
              value: t.id,
              label: `${t.nome} — ${t.congregacao.nome}`,
            }))}
          />
          <Input
            label="Data de nascimento"
            type="date"
            value={form.dataNascimento}
            onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))}
          />
          {erro && <p className="text-red-600 text-xs">{erro}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={criar} disabled={salvando || !form.nome || !form.turmaId}>
              {salvando ? "Salvando…" : "Adicionar aluno"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
