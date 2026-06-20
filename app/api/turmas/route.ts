import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPapel, escopoTurma } from "@/lib/rbac";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const turmas = await prisma.turma.findMany({
    where: escopoTurma(user),
    include: {
      congregacao: { select: { id: true, nome: true } },
      _count: { select: { alunos: true } },
    },
    orderBy: [{ congregacao: { nome: "asc" } }, { nome: "asc" }],
  });

  return NextResponse.json(turmas);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    assertPapel(user, "PASTOR_CONGREGACAO");
  } catch {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, faixaEtaria, congregacaoId } = await request.json() as {
    nome: string;
    faixaEtaria?: string;
    congregacaoId: string;
  };

  if (!nome || !congregacaoId) {
    return NextResponse.json({ error: "nome e congregacaoId são obrigatórios" }, { status: 400 });
  }

  // Pastor só pode criar na sua própria congregação
  if (user.papel === "PASTOR_CONGREGACAO" && user.congregacaoId !== congregacaoId) {
    return NextResponse.json({ error: "Sem permissão para esta congregação" }, { status: 403 });
  }

  // Gestor só pode criar em congregações da sua subsede
  if (user.papel === "GESTOR_SUBSEDE") {
    const cong = await prisma.congregacao.findUnique({ where: { id: congregacaoId } });
    if (!cong || cong.subsedeId !== user.subsedeId) {
      return NextResponse.json({ error: "Sem permissão para esta congregação" }, { status: 403 });
    }
  }

  const turma = await prisma.turma.create({
    data: { nome, faixaEtaria, congregacaoId },
    include: { congregacao: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(turma, { status: 201 });
}
