"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string | null;
  congregacao: { id: string; nome: string };
  _count: { alunos: number; registrosAula: number };
};

type Congregacao = { id: string; nome: string };

interface Props {
  turmasIniciais: Turma[];
  congregacoes: Congregacao[];
  podeCriar: boolean;
}

const FAIXAS = [
  "Infantil (6-9 anos)",
  "Juvenil (10-14 anos)",
  "Adultos",
  "Terceira Idade",
];

export function TurmasClient({ turmasIniciais, congregacoes, podeCriar }: Props) {
  const [turmas, setTurmas] = useState(turmasIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", faixaEtaria: "", congregacaoId: "" });

  async function criar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as Turma & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar turma");
      setTurmas((prev) => [...prev, { ...data, _count: { alunos: 0, registrosAula: 0 } }]);
      setModalAberto(false);
      setForm({ nome: "", faixaEtaria: "", congregacaoId: "" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Turmas</h1>
        {podeCriar && (
          <Button onClick={() => setModalAberto(true)}>+ Nova turma</Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Turma</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Congregação</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Faixa Etária</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Alunos</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Aulas</th>
            </tr>
          </thead>
          <tbody>
            {turmas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma turma encontrada.
                </td>
              </tr>
            )}
            {turmas.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{t.nome}</td>
                <td className="px-4 py-3 text-slate-500">{t.congregacao.nome}</td>
                <td className="px-4 py-3 text-slate-500">{t.faixaEtaria ?? "—"}</td>
                <td className="px-4 py-3 text-right text-slate-500">{t._count.alunos}</td>
                <td className="px-4 py-3 text-right text-slate-500">{t._count.registrosAula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal titulo="Nova Turma" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <div className="flex flex-col gap-3">
          <Input
            label="Nome da turma *"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Ex: Turma Jovens"
          />
          <Select
            label="Faixa etária"
            value={form.faixaEtaria}
            onChange={(e) => setForm((f) => ({ ...f, faixaEtaria: e.target.value }))}
            options={FAIXAS.map((f) => ({ value: f, label: f }))}
          />
          {congregacoes.length > 1 && (
            <Select
              label="Congregação *"
              value={form.congregacaoId}
              onChange={(e) => setForm((f) => ({ ...f, congregacaoId: e.target.value }))}
              options={congregacoes.map((c) => ({ value: c.id, label: c.nome }))}
            />
          )}
          {erro && <p className="text-red-600 text-xs">{erro}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button
              onClick={criar}
              disabled={salvando || !form.nome || (!form.congregacaoId && congregacoes.length > 1)}
            >
              {salvando ? "Salvando…" : "Criar turma"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
