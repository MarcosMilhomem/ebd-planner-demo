import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoTurma } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { FrequenciaClient } from "./frequencia-client";

export default async function FrequenciaPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const where = escopoTurma(user);

  const [registros, turmas] = await Promise.all([
    prisma.registroAula.findMany({
      where: { turma: where },
      include: {
        turma: { select: { nome: true, congregacao: { select: { nome: true } } } },
        presencas: { select: { presente: true } },
      },
      orderBy: { data: "desc" },
      take: 50,
    }),
    prisma.turma.findMany({
      where,
      include: {
        alunos: { select: { id: true, nome: true }, orderBy: { nome: "asc" } },
        congregacao: { select: { nome: true } },
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  return <FrequenciaClient registrosIniciais={registros} turmas={turmas} />;
}
