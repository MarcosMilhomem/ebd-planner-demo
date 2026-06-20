import type { Papel, Prisma } from "@prisma/client";
import type { SessionUser } from "./auth";

// Hierarquia de papéis em ordem de permissão (maior índice = mais restrito).
const HIERARQUIA: Papel[] = [
  "ADMIN_GERAL",
  "GESTOR_SUBSEDE",
  "PASTOR_CONGREGACAO",
  "PROFESSOR",
];

/** Verifica se o usuário tem pelo menos o papel exigido (ou mais elevado). */
export function temPapel(user: SessionUser, minimo: Papel): boolean {
  return HIERARQUIA.indexOf(user.papel) <= HIERARQUIA.indexOf(minimo);
}

export function isAdminGeral(user: SessionUser) {
  return user.papel === "ADMIN_GERAL";
}

export function isGestorSubsede(user: SessionUser) {
  return user.papel === "GESTOR_SUBSEDE";
}

export function isPastorCongregacao(user: SessionUser) {
  return user.papel === "PASTOR_CONGREGACAO";
}

export function isProfessor(user: SessionUser) {
  return user.papel === "PROFESSOR";
}

/**
 * Retorna o filtro Prisma `where` para limitar dados ao escopo do usuário.
 *
 * - Admin Geral: vê tudo (sem filtro extra).
 * - Gestor de Subsede: vê apenas a sua subsede e seus filhos.
 * - Pastor: vê apenas a sua congregação e seus filhos.
 * - Professor: vê apenas as turmas em que está vinculado.
 */
export function escopoSubsede(user: SessionUser): Prisma.SubsedeWhereInput {
  if (user.papel === "GESTOR_SUBSEDE" && user.subsedeId) {
    return { id: user.subsedeId };
  }
  return {};
}

/** Filtro para usar diretamente em prisma.congregacao.findMany/count */
export function escopoCongregacao(user: SessionUser): Prisma.CongregacaoWhereInput {
  if (user.papel === "PASTOR_CONGREGACAO" && user.congregacaoId) {
    return { id: user.congregacaoId };
  }
  if (user.papel === "GESTOR_SUBSEDE" && user.subsedeId) {
    return { subsedeId: user.subsedeId };
  }
  return {};
}

export function escopoTurma(user: SessionUser): Prisma.TurmaWhereInput {
  if (user.papel === "PROFESSOR") {
    return { professores: { some: { id: user.id } } };
  }
  if (user.papel === "PASTOR_CONGREGACAO" && user.congregacaoId) {
    return { congregacaoId: user.congregacaoId };
  }
  if (user.papel === "GESTOR_SUBSEDE" && user.subsedeId) {
    return { congregacao: { subsedeId: user.subsedeId } };
  }
  return {};
}

/** Lança erro 403 se o usuário não tiver o papel mínimo exigido. */
export function assertPapel(user: SessionUser, minimo: Papel): void {
  if (!temPapel(user, minimo)) {
    throw new Error(`Acesso negado. Papel mínimo exigido: ${minimo}`);
  }
}
