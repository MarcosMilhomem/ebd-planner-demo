import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoCongregacao, escopoTurma } from "@/lib/rbac";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const whereCongregacao = escopoCongregacao(user);
  const whereTurma = escopoTurma(user);

  const [subsedes, congregacoes, turmas, alunos, registros] = await Promise.all([
    user.papel === "ADMIN_GERAL"
      ? prisma.subsede.count()
      : Promise.resolve(null),
    prisma.congregacao.count({ where: whereCongregacao }),
    prisma.turma.count({ where: whereTurma }),
    prisma.aluno.count({ where: { turma: { ...whereTurma } } }),
    prisma.registroAula.count({ where: { turma: { ...whereTurma } } }),
  ]);

  return NextResponse.json({ subsedes, congregacoes, turmas, alunos, registros });
}
