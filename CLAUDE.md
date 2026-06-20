# EBD Planner — Demo Pública (Portfólio)

## Visão geral do projeto

Esta é uma **versão demonstrativa pública** do EBD Planner, um sistema de gestão para
Escola Bíblica Dominical (EBD) de igrejas. O sistema real é desenvolvido em
FastAPI + Prisma; **esta demo é uma reconstrução simplificada em Next.js full-stack**,
feita exclusivamente para portfólio, hospedada gratuitamente na Vercel.

**Importante:**
- Todos os dados são **fictícios** (igrejas, pessoas, turmas, frequência). Nunca usar
  dados reais de igreja aqui.
- O objetivo é demonstrar arquitetura, modelagem de domínio e RBAC — não é um produto
  em produção real.
- Prioridade: simplicidade, estabilidade e clareza de código sobre completude de features.

## Stack definida

- **Framework**: Next.js (App Router), TypeScript
- **ORM**: Prisma
- **Banco de dados**: PostgreSQL serverless (Neon ou Supabase — usar connection string
  com pooling, ex: `?pgbouncer=true` no caso do Supabase, ou o pooled connection string
  do Neon)
- **Deploy**: Vercel (free tier)
- **Auth**: simplificada — login "de um clique" por papel (ver seção RBAC), sem fluxo
  de cadastro real
- **Reset de dados**: rota `/api/reset-demo` chamada por um Vercel Cron Job (1x/dia no
  free tier), que re-executa o seed e limpa dados sujos

## Domínio / Hierarquia organizacional

A estrutura da igreja segue 3 níveis, nessa ordem hierárquica:

```
Sede
 └── Subsede
      └── Congregação
           └── Turma de EBD
                ├── Professor(es)
                ├── Alunos
                └── Registros de aula (lição + frequência)
```

Regras de domínio:
- Uma Sede tem várias Subsedes.
- Uma Subsede tem várias Congregações.
- Uma Congregação tem várias Turmas de EBD.
- Uma Turma tem um ou mais professores e vários alunos.
- Cada aula registrada tem: data, lição/tema, lista de presença dos alunos.

## RBAC (papéis e permissões)

| Papel | Escopo | Pode fazer |
|---|---|---|
| **Admin Geral** | Toda a Sede | Ver e gerenciar tudo: Subsedes, Congregações, Turmas, usuários, relatórios globais |
| **Gestor de Subsede** | Uma Subsede | Gerenciar Congregações e Turmas dentro da sua Subsede; ver relatórios da Subsede |
| **Pastor/Líder de Congregação** | Uma Congregação | Gerenciar Turmas e Professores da sua Congregação; ver relatórios da Congregação |
| **Professor** | Uma ou mais Turmas | Registrar aulas, lançar frequência, ver/editar alunos da sua turma |

Regras importantes de RBAC:
- Cada usuário pertence a exatamente um papel.
- O escopo de dados visíveis é sempre restrito ao nível hierárquico do papel (ex: um
  Gestor de Subsede nunca vê dados de outra Subsede).
- Na demo, a "autenticação" é simplificada: tela inicial com botões "Entrar como Admin",
  "Entrar como Gestor de Subsede", "Entrar como Pastor", "Entrar como Professor" — cada
  botão loga automaticamente como um usuário fictício pré-criado pelo seed, sem senha.
- Ações destrutivas (delete em massa, exclusão de Sede/Subsede/Congregação) devem ser
  desabilitadas ou bloqueadas no modo demo, mesmo para o Admin.

## Estrutura de pastas esperada

```
ebd-planner-demo/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          → botões de login por papel
│   ├── dashboard/
│   │   ├── page.tsx                 → home pós-login, varia conforme papel
│   │   ├── subsedes/...
│   │   ├── congregacoes/...
│   │   ├── turmas/...
│   │   └── frequencia/...
│   ├── api/
│   │   ├── reset-demo/route.ts      → endpoint chamado pelo cron job
│   │   └── ...                      → demais rotas/Server Actions
│   └── layout.tsx
├── lib/
│   ├── prisma.ts                    → client singleton (obrigatório em serverless)
│   └── rbac.ts                      → helpers de checagem de permissão
├── components/
│   └── ...
├── vercel.json                       → configuração do cron job
└── README.md                          → case técnico para portfólio
```

## Convenções de código

- TypeScript estrito (`strict: true` no tsconfig).
- Nomes de modelos Prisma em PascalCase singular (`Sede`, `Subsede`, `Congregacao`,
  `Turma`, `Usuario`, `Aluno`, `RegistroAula`).
- Nomes de campos em camelCase.
- Sempre usar o client singleton do Prisma (`lib/prisma.ts`) — nunca instanciar
  `PrismaClient` diretamente em rotas, para evitar esgotamento de conexões em
  ambiente serverless.
- Commits pequenos e descritivos, em português, no padrão:
  `feat: adiciona schema de turmas`, `fix: corrige escopo RBAC do gestor`.
- Trabalhar em etapas: schema/migrations → seed → auth/RBAC → telas → polimento.
  Não tentar gerar tudo de uma vez.

## Dados fictícios esperados no seed

- 1 Sede (ex: "Sede Central")
- 2 a 3 Subsedes
- 3 a 5 Congregações distribuídas entre as Subsedes
- 2 a 4 Turmas de EBD por Congregação
- Professores, alunos e registros de aula/frequência fictícios, com nomes genéricos
  (evitar nomes que pareçam pessoas reais)
- Um usuário fictício pré-criado para cada papel do RBAC, pronto pro botão de
  "login rápido"

## Fora de escopo para esta demo

- Cadastro/autenticação real (login com senha, recuperação de senha, etc.)
- Notificações, envio de e-mail/WhatsApp
- Pagamentos ou qualquer integração financeira
- Multi-idioma
- Qualquer dado real de igreja, pessoa real ou informação sensível
