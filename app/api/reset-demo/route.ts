import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Papel } from "@prisma/client";

// Rota chamada pelo cron job da Vercel (vercel.json) uma vez por dia.
// Limpa dados sujos e re-semeie os dados fictícios do demo.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await resetDemo();
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}

async function resetDemo() {
  // Limpa tudo na ordem correta (foreign keys)
  await prisma.presenca.deleteMany();
  await prisma.registroAula.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.congregacao.deleteMany();
  await prisma.subsede.deleteMany();
  await prisma.sede.deleteMany();

  // Re-seed (mesma lógica do prisma/seed.ts, mas inline para evitar exec de processo)
  const NOMES_ALUNOS = [
    "Lucas Andrade", "Maria Eduarda", "Pedro Henrique", "Ana Beatriz",
    "Gabriel Souza", "Júlia Ramos", "Mateus Lima", "Larissa Costa",
    "Rafael Pereira", "Camila Dias", "Bruno Carvalho", "Isabela Martins",
    "Thiago Rocha", "Beatriz Fernandes", "Felipe Barros", "Sofia Cardoso",
    "Davi Nogueira", "Alice Teixeira", "Enzo Ribeiro", "Laura Pinto",
  ];
  const LICOES = [
    "O Bom Pastor", "A Criação do Mundo", "Davi e Golias",
    "O Filho Pródigo", "Os Frutos do Espírito", "Noé e a Arca",
    "Jesus Alimenta a Multidão", "Daniel na Cova dos Leões",
  ];
  const FAIXAS = ["Infantil (6-9 anos)", "Juvenil (10-14 anos)", "Adultos"];

  const sede = await prisma.sede.create({ data: { nome: "Sede Central" } });
  await prisma.usuario.create({
    data: { nome: "Admin Geral (Demo)", email: "admin.demo@ebdplanner.app", papel: Papel.ADMIN_GERAL, sedeId: sede.id },
  });

  const nomesSubsedes = ["Subsede Norte", "Subsede Sul"];
  const subsedes = [];
  for (const nome of nomesSubsedes) {
    const s = await prisma.subsede.create({ data: { nome, sedeId: sede.id } });
    subsedes.push(s);
    await prisma.usuario.create({
      data: {
        nome: `Gestor(a) — ${nome} (Demo)`,
        email: `gestor.${nome.toLowerCase().replace(/\s+/g, "-")}@ebdplanner.app`,
        papel: Papel.GESTOR_SUBSEDE,
        subsedeId: s.id,
      },
    });
  }

  const nomesCongregacoes = [
    ["Congregação Central Norte", "Congregação Jardim das Flores"],
    ["Congregação Vila Esperança", "Congregação Bom Pastor"],
  ];
  const congregacoes = [];
  for (let i = 0; i < subsedes.length; i++) {
    for (const nomeCong of nomesCongregacoes[i]) {
      const c = await prisma.congregacao.create({
        data: { nome: nomeCong, endereco: "Endereço fictício, 123 — Bairro Demo", subsedeId: subsedes[i].id },
      });
      congregacoes.push(c);
      await prisma.usuario.create({
        data: {
          nome: `Pastor(a) — ${nomeCong} (Demo)`,
          email: `pastor.${c.id}@ebdplanner.app`,
          papel: Papel.PASTOR_CONGREGACAO,
          congregacaoId: c.id,
        },
      });
    }
  }

  let idx = 0;
  for (const congregacao of congregacoes) {
    for (let t = 0; t < 2; t++) {
      const faixa = FAIXAS[t % FAIXAS.length];
      const turma = await prisma.turma.create({
        data: { nome: `Turma ${faixa}`, faixaEtaria: faixa, congregacaoId: congregacao.id },
      });
      await prisma.usuario.create({
        data: {
          nome: `Professor(a) — ${turma.nome} / ${congregacao.nome} (Demo)`,
          email: `professor.${turma.id}@ebdplanner.app`,
          papel: Papel.PROFESSOR,
          congregacaoId: congregacao.id,
          turmas: { connect: { id: turma.id } },
        },
      });

      const alunos = [];
      for (let a = 0; a < 6; a++) {
        const aluno = await prisma.aluno.create({
          data: {
            nome: NOMES_ALUNOS[idx % NOMES_ALUNOS.length],
            dataNascimento: new Date(2012 - t * 5, a % 12, (a % 27) + 1),
            turmaId: turma.id,
          },
        });
        alunos.push(aluno);
        idx++;
      }

      for (let r = 0; r < 3; r++) {
        const dataAula = new Date();
        dataAula.setDate(dataAula.getDate() - r * 7);
        const registro = await prisma.registroAula.create({
          data: { data: dataAula, licao: LICOES[(r + idx) % LICOES.length], turmaId: turma.id },
        });
        for (const aluno of alunos) {
          await prisma.presenca.create({
            data: { presente: Math.random() > 0.15, alunoId: aluno.id, registroAulaId: registro.id },
          });
        }
      }
    }
  }
}
