import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPapel } from "@/lib/rbac";
import type { Papel, Prisma } from "@prisma/client";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    assertPapel(user, "GESTOR_SUBSEDE");
  } catch {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const where: Prisma.UsuarioWhereInput =
    user.papel === "ADMIN_GERAL"
      ? {}
      : user.papel === "GESTOR_SUBSEDE" && user.subsedeId
      ? { OR: [{ subsedeId: user.subsedeId }, { congregacao: { subsedeId: user.subsedeId } }] }
      : { congregacaoId: user.congregacaoId ?? undefined };

  const usuarios = await prisma.usuario.findMany({
    where,
    select: {
      id: true, nome: true, email: true, papel: true,
      sede: { select: { nome: true } },
      subsede: { select: { nome: true } },
      congregacao: { select: { nome: true } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    assertPapel(user, "GESTOR_SUBSEDE");
  } catch {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, email, papel, subsedeId, congregacaoId, turmaId } = await request.json() as {
    nome: string;
    email: string;
    papel: Papel;
    subsedeId?: string;
    congregacaoId?: string;
    turmaId?: string;
  };

  if (!nome || !email || !papel) {
    return NextResponse.json({ error: "nome, email e papel são obrigatórios" }, { status: 400 });
  }

  // Gestor não pode criar Admin Geral
  if (user.papel === "GESTOR_SUBSEDE" && papel === "ADMIN_GERAL") {
    return NextResponse.json({ error: "Sem permissão para criar Admin Geral" }, { status: 403 });
  }
  // Pastor só pode criar Professores
  if (user.papel === "PASTOR_CONGREGACAO" && papel !== "PROFESSOR") {
    return NextResponse.json({ error: "Pastor só pode criar Professores" }, { status: 403 });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      papel,
      sedeId: papel === "ADMIN_GERAL" ? (await prisma.sede.findFirst())?.id : undefined,
      subsedeId: subsedeId ?? (papel === "GESTOR_SUBSEDE" ? user.subsedeId : undefined),
      congregacaoId: congregacaoId ?? (["PASTOR_CONGREGACAO", "PROFESSOR"].includes(papel) ? user.congregacaoId : undefined),
      ...(turmaId && papel === "PROFESSOR" ? { turmas: { connect: { id: turmaId } } } : {}),
    },
  });

  return NextResponse.json(usuario, { status: 201 });
}
