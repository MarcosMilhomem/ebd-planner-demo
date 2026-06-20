import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPapel, escopoCongregacao } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function CongregacoesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    assertPapel(user, "GESTOR_SUBSEDE");
  } catch {
    redirect("/dashboard");
  }

  const where = escopoCongregacao(user);

  const congregacoes = await prisma.congregacao.findMany({
    where,
    include: {
      subsede: { select: { nome: true } },
      _count: { select: { turmas: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Congregações</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Subsede</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Turmas</th>
            </tr>
          </thead>
          <tbody>
            {congregacoes.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 text-slate-800">{c.nome}</td>
                <td className="px-4 py-3 text-slate-500">{c.subsede.nome}</td>
                <td className="px-4 py-3 text-right text-slate-500">{c._count.turmas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        Ações destrutivas desabilitadas no modo demo.
      </p>
    </div>
  );
}
