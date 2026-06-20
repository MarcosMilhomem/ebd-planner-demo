import { NextResponse } from "next/server";
import { loginByEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email: string };
    if (!email) {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    const user = await loginByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
