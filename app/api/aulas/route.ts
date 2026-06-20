import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoTurma } from "@/lib/rbac";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turmaId");

  const registros = await prisma.registroAula.findMany({
    where: turmaId ? { turmaId } : { turma: escopoTurma(user) },
    include: {
      turma: { select: { nome: true } },
      presencas: {
        include: { aluno: { select: { id: true, nome: true } } },
      },
    },
    orderBy: { data: "desc" },
    take: 50,
  });

  return NextResponse.json(registros);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data, licao, turmaId, presencas } = await request.json() as {
    data: string;
    licao: string;
    turmaId: string;
    presencas: { alunoId: string; presente: boolean }[];
  };

  if (!data || !licao || !turmaId) {
    return NextResponse.json({ error: "data, licao e turmaId são obrigatórios" }, { status: 400 });
  }

  // Verifica acesso à turma
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, ...escopoTurma(user) },
  });
  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada ou sem permissão" }, { status: 403 });
  }

  const registro = await prisma.registroAula.create({
    data: {
      data: new Date(data),
      licao,
      turmaId,
      presencas: {
        create: presencas.map((p) => ({
          alunoId: p.alunoId,
          presente: p.presente,
        })),
      },
    },
    include: {
      presencas: { include: { aluno: { select: { nome: true } } } },
    },
  });

  return NextResponse.json(registro, { status: 201 });
}
