import { describe, it, expect } from "vitest";
import {
  temPapel,
  isAdminGeral,
  isGestorSubsede,
  isPastorCongregacao,
  isProfessor,
  escopoSubsede,
  escopoCongregacao,
  escopoTurma,
  assertPapel,
} from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";

function makeUser(papel: SessionUser["papel"], extra: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user-1",
    nome: "Teste",
    email: "teste@demo.app",
    papel,
    sedeId: null,
    subsedeId: null,
    congregacaoId: null,
    ...extra,
  };
}

describe("temPapel", () => {
  it("Admin Geral tem todos os papéis", () => {
    const u = makeUser("ADMIN_GERAL");
    expect(temPapel(u, "ADMIN_GERAL")).toBe(true);
    expect(temPapel(u, "GESTOR_SUBSEDE")).toBe(true);
    expect(temPapel(u, "PASTOR_CONGREGACAO")).toBe(true);
    expect(temPapel(u, "PROFESSOR")).toBe(true);
  });

  it("Professor não tem papéis mais elevados", () => {
    const u = makeUser("PROFESSOR");
    expect(temPapel(u, "ADMIN_GERAL")).toBe(false);
    expect(temPapel(u, "GESTOR_SUBSEDE")).toBe(false);
    expect(temPapel(u, "PASTOR_CONGREGACAO")).toBe(false);
    expect(temPapel(u, "PROFESSOR")).toBe(true);
  });

  it("Gestor de Subsede tem papéis abaixo mas não Admin", () => {
    const u = makeUser("GESTOR_SUBSEDE");
    expect(temPapel(u, "ADMIN_GERAL")).toBe(false);
    expect(temPapel(u, "GESTOR_SUBSEDE")).toBe(true);
    expect(temPapel(u, "PASTOR_CONGREGACAO")).toBe(true);
    expect(temPapel(u, "PROFESSOR")).toBe(true);
  });
});

describe("predicados de papel", () => {
  it("isAdminGeral", () => {
    expect(isAdminGeral(makeUser("ADMIN_GERAL"))).toBe(true);
    expect(isAdminGeral(makeUser("PROFESSOR"))).toBe(false);
  });
  it("isGestorSubsede", () => {
    expect(isGestorSubsede(makeUser("GESTOR_SUBSEDE"))).toBe(true);
    expect(isGestorSubsede(makeUser("ADMIN_GERAL"))).toBe(false);
  });
  it("isPastorCongregacao", () => {
    expect(isPastorCongregacao(makeUser("PASTOR_CONGREGACAO"))).toBe(true);
    expect(isPastorCongregacao(makeUser("GESTOR_SUBSEDE"))).toBe(false);
  });
  it("isProfessor", () => {
    expect(isProfessor(makeUser("PROFESSOR"))).toBe(true);
    expect(isProfessor(makeUser("PASTOR_CONGREGACAO"))).toBe(false);
  });
});

describe("escopoSubsede", () => {
  it("Admin retorna filtro vazio", () => {
    expect(escopoSubsede(makeUser("ADMIN_GERAL"))).toEqual({});
  });
  it("Gestor retorna filtro por id da subsede (para prisma.subsede.findMany)", () => {
    const u = makeUser("GESTOR_SUBSEDE", { subsedeId: "sub-42" });
    expect(escopoSubsede(u)).toEqual({ id: "sub-42" });
  });
  it("Gestor sem subsedeId retorna filtro vazio", () => {
    expect(escopoSubsede(makeUser("GESTOR_SUBSEDE"))).toEqual({});
  });
});

describe("escopoCongregacao", () => {
  it("Admin retorna filtro vazio", () => {
    expect(escopoCongregacao(makeUser("ADMIN_GERAL"))).toEqual({});
  });
  it("Pastor retorna filtro por id da congregação (para prisma.congregacao.findMany)", () => {
    const u = makeUser("PASTOR_CONGREGACAO", { congregacaoId: "cong-1" });
    expect(escopoCongregacao(u)).toEqual({ id: "cong-1" });
  });
  it("Gestor retorna filtro por subsedeId da congregação", () => {
    const u = makeUser("GESTOR_SUBSEDE", { subsedeId: "sub-7" });
    expect(escopoCongregacao(u)).toEqual({ subsedeId: "sub-7" });
  });
});

describe("escopoTurma", () => {
  it("Admin retorna filtro vazio", () => {
    expect(escopoTurma(makeUser("ADMIN_GERAL"))).toEqual({});
  });
  it("Professor filtra pelas suas turmas", () => {
    const u = makeUser("PROFESSOR", { id: "prof-99" });
    expect(escopoTurma(u)).toEqual({ professores: { some: { id: "prof-99" } } });
  });
  it("Pastor filtra por congregação", () => {
    const u = makeUser("PASTOR_CONGREGACAO", { congregacaoId: "cong-5" });
    expect(escopoTurma(u)).toEqual({ congregacaoId: "cong-5" });
  });
  it("Gestor filtra por subsede aninhada", () => {
    const u = makeUser("GESTOR_SUBSEDE", { subsedeId: "sub-3" });
    expect(escopoTurma(u)).toEqual({ congregacao: { subsedeId: "sub-3" } });
  });
});

describe("assertPapel", () => {
  it("não lança quando papel é suficiente", () => {
    expect(() => assertPapel(makeUser("ADMIN_GERAL"), "PROFESSOR")).not.toThrow();
    expect(() => assertPapel(makeUser("PROFESSOR"), "PROFESSOR")).not.toThrow();
  });
  it("lança quando papel é insuficiente", () => {
    expect(() => assertPapel(makeUser("PROFESSOR"), "ADMIN_GERAL")).toThrow("Acesso negado");
    expect(() => assertPapel(makeUser("GESTOR_SUBSEDE"), "ADMIN_GERAL")).toThrow("Acesso negado");
  });
});
