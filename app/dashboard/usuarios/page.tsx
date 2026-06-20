import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPapel, escopoCongregacao } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UsuariosClient } from "./usuarios-client";
import type { Papel, Prisma } from "@prisma/client";

export default async function UsuariosPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    assertPapel(user, "GESTOR_SUBSEDE");
  } catch {
    redirect("/dashboard");
  }

  const whereUsuarios: Prisma.UsuarioWhereInput =
    user.papel === "ADMIN_GERAL"
      ? {}
      : user.papel === "GESTOR_SUBSEDE" && user.subsedeId
      ? { OR: [{ subsedeId: user.subsedeId }, { congregacao: { subsedeId: user.subsedeId } }] }
      : { congregacaoId: user.congregacaoId ?? undefined };

  const [usuarios, congregacoes, subsedes, turmas] = await Promise.all([
    prisma.usuario.findMany({
      where: whereUsuarios,
      select: {
        id: true, nome: true, email: true, papel: true,
        subsede: { select: { nome: true } },
        congregacao: { select: { nome: true } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.congregacao.findMany({
      where: escopoCongregacao(user),
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    user.papel === "ADMIN_GERAL"
      ? prisma.subsede.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } })
      : Promise.resolve([]),
    prisma.turma.findMany({
      where: { congregacao: escopoCongregacao(user) },
      select: { id: true, nome: true, congregacao: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    }),
  ]);

  const papeisPermitidos: Papel[] =
    user.papel === "ADMIN_GERAL"
      ? ["GESTOR_SUBSEDE", "PASTOR_CONGREGACAO", "PROFESSOR"]
      : user.papel === "GESTOR_SUBSEDE"
      ? ["PASTOR_CONGREGACAO", "PROFESSOR"]
      : ["PROFESSOR"];

  return (
    <UsuariosClient
      usuariosIniciais={usuarios}
      congregacoes={congregacoes}
      subsedes={subsedes}
      turmas={turmas}
      papeisPermitidos={papeisPermitidos}
      papelAtual={user.papel}
    />
  );
}
