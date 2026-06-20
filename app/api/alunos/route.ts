import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escopoTurma } from "@/lib/rbac";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turmaId");

  const where = turmaId
    ? { turmaId }
    : { turma: escopoTurma(user) };

  const alunos = await prisma.aluno.findMany({
    where,
    include: { turma: { select: { id: true, nome: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(alunos);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { nome, dataNascimento, turmaId } = await request.json() as {
    nome: string;
    dataNascimento?: string;
    turmaId: string;
  };

  if (!nome || !turmaId) {
    return NextResponse.json({ error: "nome e turmaId são obrigatórios" }, { status: 400 });
  }

  // Verifica se o usuário tem acesso à turma
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, ...escopoTurma(user) },
  });
  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada ou sem permissão" }, { status: 403 });
  }

  const aluno = await prisma.aluno.create({
    data: {
      nome,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
      turmaId,
    },
    include: { turma: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(aluno, { status: 201 });
}
