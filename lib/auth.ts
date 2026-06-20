import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Papel } from "@prisma/client";

const COOKIE_NAME = "ebd_session";
const SESSION_DURATION = 60 * 60 * 24; // 24h

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  sedeId: string | null;
  subsedeId: string | null;
  congregacaoId: string | null;
}

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não configurado");
  return new TextEncoder().encode(s);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Login sem senha — demo apenas. Busca o usuário pelo e-mail e cria sessão.
export async function loginByEmail(email: string): Promise<SessionUser | null> {
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    sedeId: user.sedeId,
    subsedeId: user.subsedeId,
    congregacaoId: user.congregacaoId,
  };

  await createSession(sessionUser);
  return sessionUser;
}
