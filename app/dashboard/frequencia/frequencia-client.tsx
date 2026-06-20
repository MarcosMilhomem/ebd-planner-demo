"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type Registro = {
  id: string;
  data: Date | string;
  licao: string;
  turma: { nome: string; congregacao: { nome: string } };
  presencas: { presente: boolean }[];
};

type Aluno = { id: string; nome: string };
type Turma = {
  id: string;
  nome: string;
  congregacao: { nome: string };
  alunos: Aluno[];
};

interface Props {
  registrosIniciais: Registro[];
  turmas: Turma[];
}

export function FrequenciaClient({ registrosIniciais, turmas }: Props) {
  const [registros, setRegistros] = useState(registrosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [turmaId, setTurmaId] = useState("");
  const [licao, setLicao] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  function selecionarTurma(id: string) {
    setTurmaId(id);
    const t = turmas.find((t) => t.id === id);
    if (t) {
      const inicial: Record<string, boolean> = {};
      t.alunos.forEach((a) => (inicial[a.id] = true));
      setPresencas(inicial);
    }
  }

  function togglePresenca(alunoId: string) {
    setPresencas((prev) => ({ ...prev, [alunoId]: !prev[alunoId] }));
  }

  async function registrar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/aulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turmaId,
          licao,
          data,
          presencas: Object.entries(presencas).map(([alunoId, presente]) => ({
            alunoId,
            presente,
          })),
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar aula");

      // Monta o registro local para exibição imediata
      const t = turmas.find((t) => t.id === turmaId)!;
      const novoRegistro: Registro = {
        id: crypto.randomUUID(),
        data,
        licao,
        turma: { nome: t.nome, congregacao: t.congregacao },
        presencas: Object.values(presencas).map((presente) => ({ presente })),
      };
      setRegistros((prev) => [novoRegistro, ...prev]);
      setModalAberto(false);
      setTurmaId("");
      setLicao("");
      setPresencas({});
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Frequência</h1>
        {turmas.length > 0 && (
          <Button onClick={() => setModalAberto(true)}>+ Registrar aula</Button>
        )}
      </div>
      <p className="text-slate-500 text-sm mb-4">Últimas 50 aulas registradas no seu escopo.</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Data</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Lição</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Turma</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Presentes</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">% Freq.</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma aula registrada.
                </td>
              </tr>
            )}
            {registros.map((r, i) => {
              const total = r.presencas.length;
              const presentes = r.presencas.filter((p) => p.presente).length;
              const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
              return (
                <tr key={r.id ?? i} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{r.licao}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.turma.nome}
                    <span className="text-slate-400"> / {r.turma.congregacao.nome}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{presentes}/{total}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal titulo="Registrar Aula" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
          <Select
            label="Turma *"
            value={turmaId}
            onChange={(e) => selecionarTurma(e.target.value)}
            options={turmas.map((t) => ({
              value: t.id,
              label: `${t.nome} — ${t.congregacao.nome}`,
            }))}
          />
          <Input
            label="Lição / Tema *"
            value={licao}
            onChange={(e) => setLicao(e.target.value)}
            placeholder="Ex: O Sermão da Montanha"
          />
          <Input
            label="Data da aula *"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          {turmaSelecionada && turmaSelecionada.alunos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Lista de presença</p>
              <div className="flex flex-col gap-1 border border-slate-100 rounded-lg p-2">
                <div className="flex justify-end gap-4 text-xs text-slate-400 px-2 mb-1">
                  <button
                    className="hover:text-slate-600"
                    onClick={() => {
                      const todos: Record<string, boolean> = {};
                      turmaSelecionada.alunos.forEach((a) => (todos[a.id] = true));
                      setPresencas(todos);
                    }}
                  >
                    Todos presentes
                  </button>
                  <button
                    className="hover:text-slate-600"
                    onClick={() => {
                      const nenhum: Record<string, boolean> = {};
                      turmaSelecionada.alunos.forEach((a) => (nenhum[a.id] = false));
                      setPresencas(nenhum);
                    }}
                  >
                    Limpar
                  </button>
                </div>
                {turmaSelecionada.alunos.map((aluno) => (
                  <label
                    key={aluno.id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={presencas[aluno.id] ?? true}
                      onChange={() => togglePresenca(aluno.id)}
                      className="w-4 h-4 accent-slate-700"
                    />
                    <span className="text-sm text-slate-700">{aluno.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {erro && <p className="text-red-600 text-xs">{erro}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button
              onClick={registrar}
              disabled={salvando || !turmaId || !licao || !data}
            >
              {salvando ? "Salvando…" : "Registrar aula"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
