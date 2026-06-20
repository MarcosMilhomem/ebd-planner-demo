import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPapel } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function SubsedesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    assertPapel(user, "ADMIN_GERAL");
  } catch {
    redirect("/dashboard");
  }

  const subsedes = await prisma.subsede.findMany({
    include: {
      _count: { select: { congregacoes: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Subsedes</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Nome</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Congregações</th>
            </tr>
          </thead>
          <tbody>
            {subsedes.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 text-slate-800">{s.nome}</td>
                <td className="px-4 py-3 text-right text-slate-500">{s._count.congregacoes}</td>
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
