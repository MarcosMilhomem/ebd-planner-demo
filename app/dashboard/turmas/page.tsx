import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoCongregacao, escopoTurma, temPapel } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TurmasClient } from "./turmas-client";

export default async function TurmasPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [turmas, congregacoes] = await Promise.all([
    prisma.turma.findMany({
      where: escopoTurma(user),
      include: {
        congregacao: { select: { id: true, nome: true } },
        _count: { select: { alunos: true, registrosAula: true } },
      },
      orderBy: [{ congregacao: { nome: "asc" } }, { nome: "asc" }],
    }),
    // Congregações disponíveis para criar turma nelas
    temPapel(user, "PASTOR_CONGREGACAO")
      ? prisma.congregacao.findMany({
          where: escopoCongregacao(user),
          select: { id: true, nome: true },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const podeCriar = temPapel(user, "PASTOR_CONGREGACAO");

  return (
    <TurmasClient
      turmasIniciais={turmas}
      congregacoes={congregacoes}
      podeCriar={podeCriar}
    />
  );
}
