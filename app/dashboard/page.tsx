import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoCongregacao, escopoTurma } from "@/lib/rbac";
import { redirect } from "next/navigation";

const PAPEL_LABEL: Record<string, string> = {
  ADMIN_GERAL: "Admin Geral",
  GESTOR_SUBSEDE: "Gestor de Subsede",
  PASTOR_CONGREGACAO: "Pastor / Líder de Congregação",
  PROFESSOR: "Professor",
};

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const whereCongregacao = escopoCongregacao(user);
  const whereTurma = escopoTurma(user);

  const [subsedes, congregacoes, turmas, alunos, registros] = await Promise.all([
    user.papel === "ADMIN_GERAL" ? prisma.subsede.count() : Promise.resolve(null),
    prisma.congregacao.count({ where: whereCongregacao }),
    prisma.turma.count({ where: whereTurma }),
    prisma.aluno.count({ where: { turma: { ...whereTurma } } }),
    prisma.registroAula.count({ where: { turma: { ...whereTurma } } }),
  ]);

  const cards = [
    subsedes !== null && { label: "Subsedes", valor: subsedes },
    { label: "Congregações", valor: congregacoes },
    { label: "Turmas", valor: turmas },
    { label: "Alunos", valor: alunos },
    { label: "Registros de aula", valor: registros },
  ].filter(Boolean) as { label: string; valor: number }[];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Bem-vindo, {user.nome.split(" ")[0]}!</h1>
        <p className="text-slate-500 mt-1">
          Papel: <span className="font-medium">{PAPEL_LABEL[user.papel]}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-3xl font-bold text-slate-800">{card.valor}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Demo de portfólio.</strong> Todos os dados são fictícios e resetados diariamente.
      </div>
    </div>
  );
}
