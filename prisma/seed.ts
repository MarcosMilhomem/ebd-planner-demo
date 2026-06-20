// EBD Planner — Demo (Portfólio)
// Seed de dados fictícios. Rodar com: npx prisma db seed
// Re-executado automaticamente pela rota /api/reset-demo (cron job da Vercel).

import { PrismaClient, Papel } from "@prisma/client";

const prisma = new PrismaClient();

// Nomes genéricos fictícios — não correspondem a pessoas reais.
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

async function limparBanco() {
  // Ordem importa por causa das foreign keys
  await prisma.presenca.deleteMany();
  await prisma.registroAula.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.congregacao.deleteMany();
  await prisma.subsede.deleteMany();
  await prisma.sede.deleteMany();
}

async function main() {
  console.log("Limpando banco de dados...");
  await limparBanco();

  console.log("Criando Sede...");
  const sede = await prisma.sede.create({
    data: { nome: "Sede Central" },
  });

  // Usuário Admin Geral — login rápido
  const admin = await prisma.usuario.create({
    data: {
      nome: "Admin Geral (Demo)",
      email: "admin.demo@ebdplanner.app",
      papel: Papel.ADMIN_GERAL,
      sedeId: sede.id,
    },
  });

  console.log("Criando Subsedes...");
  const nomesSubsedes = ["Subsede Norte", "Subsede Sul"];
  const subsedes = [];
  for (const nome of nomesSubsedes) {
    const subsede = await prisma.subsede.create({
      data: { nome, sedeId: sede.id },
    });
    subsedes.push(subsede);
  }

  // Usuários Gestor de Subsede — um por subsede
  const gestores = [];
  for (const subsede of subsedes) {
    const gestor = await prisma.usuario.create({
      data: {
        nome: `Gestor(a) — ${subsede.nome} (Demo)`,
        email: `gestor.${subsede.nome.toLowerCase().replace(/\s+/g, "-")}@ebdplanner.app`,
        papel: Papel.GESTOR_SUBSEDE,
        subsedeId: subsede.id,
      },
    });
    gestores.push(gestor);
  }

  console.log("Criando Congregações...");
  const nomesCongregacoes = [
    ["Congregação Central Norte", "Congregação Jardim das Flores"],
    ["Congregação Vila Esperança", "Congregação Bom Pastor"],
  ];

  const congregacoes = [];
  for (let i = 0; i < subsedes.length; i++) {
    for (const nomeCong of nomesCongregacoes[i]) {
      const congregacao = await prisma.congregacao.create({
        data: {
          nome: nomeCong,
          endereco: "Endereço fictício, 123 — Bairro Demo",
          subsedeId: subsedes[i].id,
        },
      });
      congregacoes.push(congregacao);
    }
  }

  // Usuários Pastor/Líder de Congregação — um por congregação
  const pastores = [];
  for (const congregacao of congregacoes) {
    const pastor = await prisma.usuario.create({
      data: {
        nome: `Pastor(a) — ${congregacao.nome} (Demo)`,
        email: `pastor.${congregacao.id}@ebdplanner.app`,
        papel: Papel.PASTOR_CONGREGACAO,
        congregacaoId: congregacao.id,
      },
    });
    pastores.push(pastor);
  }

  console.log("Criando Turmas, Professores, Alunos, Aulas e Presença...");
  const faixasEtarias = ["Infantil (6-9 anos)", "Juvenil (10-14 anos)", "Adultos"];

  let nomeAlunoIdx = 0;
  let professorPrincipalCriado = false;

  for (const congregacao of congregacoes) {
    // 2 turmas por congregação
    for (let t = 0; t < 2; t++) {
      const turma = await prisma.turma.create({
        data: {
          nome: `Turma ${faixasEtarias[t % faixasEtarias.length]}`,
          faixaEtaria: faixasEtarias[t % faixasEtarias.length],
          congregacaoId: congregacao.id,
        },
      });

      // Professor da turma
      const professor = await prisma.usuario.create({
        data: {
          nome: `Professor(a) — ${turma.nome} / ${congregacao.nome} (Demo)`,
          email: `professor.${turma.id}@ebdplanner.app`,
          papel: Papel.PROFESSOR,
          congregacaoId: congregacao.id,
          turmas: { connect: { id: turma.id } },
        },
      });

      // Guarda o e-mail do primeiro professor criado para usar no botão
      // de "login rápido" genérico (ver README / tela de login).
      if (!professorPrincipalCriado) {
        console.log(`> Professor de exemplo para login rápido: ${professor.email}`);
        professorPrincipalCriado = true;
      }

      // 6 alunos por turma
      const alunosTurma = [];
      for (let a = 0; a < 6; a++) {
        const nome = NOMES_ALUNOS[nomeAlunoIdx % NOMES_ALUNOS.length];
        nomeAlunoIdx++;
        const aluno = await prisma.aluno.create({
          data: {
            nome,
            dataNascimento: new Date(2012 - (t * 5), a % 12, (a % 27) + 1),
            turmaId: turma.id,
          },
        });
        alunosTurma.push(aluno);
      }

      // 3 registros de aula por turma, com presença de cada aluno
      for (let r = 0; r < 3; r++) {
        const dataAula = new Date();
        dataAula.setDate(dataAula.getDate() - (r * 7)); // últimas 3 semanas

        const registroAula = await prisma.registroAula.create({
          data: {
            data: dataAula,
            licao: LICOES[(r + nomeAlunoIdx) % LICOES.length],
            turmaId: turma.id,
          },
        });

        for (const aluno of alunosTurma) {
          // ~85% de chance de presença, pra parecer dado real
          const presente = Math.random() > 0.15;
          await prisma.presenca.create({
            data: {
              presente,
              alunoId: aluno.id,
              registroAulaId: registroAula.id,
            },
          });
        }
      }
    }
  }

  console.log("\nSeed concluído!");
  console.log("Usuários para login rápido (demo):");
  console.log(`- Admin Geral:      ${admin.email}`);
  gestores.forEach((g) => console.log(`- Gestor Subsede:   ${g.email}`));
  pastores.forEach((p) => console.log(`- Pastor Congreg.:  ${p.email}`));
  console.log("- Professores: ver e-mails gerados por turma (padrão professor.<turmaId>@ebdplanner.app)");
}

main()
  .catch((e) => {
    console.error("Erro ao executar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
