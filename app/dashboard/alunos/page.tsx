import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoTurma } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AlunosClient } from "./alunos-client";

export default async function AlunosPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [alunos, turmas] = await Promise.all([
    prisma.aluno.findMany({
      where: { turma: escopoTurma(user) },
      include: { turma: { select: { id: true, nome: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.turma.findMany({
      where: escopoTurma(user),
      select: { id: true, nome: true, congregacao: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    }),
  ]);

  return <AlunosClient alunosIniciais={alunos} turmas={turmas} />;
}
