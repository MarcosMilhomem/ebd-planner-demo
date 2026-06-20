# EBD Planner — Demo

> Versão demonstrativa pública do EBD Planner, sistema de gestão para Escola Bíblica
> Dominical (EBD) de igrejas. Criada para fins de portfólio — todos os dados são fictícios.

🔗 **Demo ao vivo:** _[link após deploy na Vercel]_
💻 **Repositório:** [github.com/MarcosMilhomem/ebd-planner-demo](https://github.com/MarcosMilhomem/ebd-planner-demo)

---

## O problema

Igrejas com estrutura hierárquica (Sede → Subsede → Congregação → Turma) costumam
gerenciar a Escola Bíblica Dominical em planilhas soltas ou cadernos físicos, sem
visibilidade centralizada sobre frequência, turmas e responsáveis em cada nível.

O EBD Planner resolve isso com um sistema multi-nível, onde cada papel (Admin, Gestor
de Subsede, Pastor de Congregação, Professor) tem acesso apenas ao escopo de dados que
lhe compete — sem perder a visão consolidada para quem está no topo da hierarquia.

> Esta demo é uma reconstrução simplificada (Next.js full-stack) da versão real do
> produto, que é desenvolvida em FastAPI + Prisma. A simplificação foi necessária para
> viabilizar hospedagem 100% gratuita na Vercel.

---

## Funcionalidades

- Gestão hierárquica: Sede → Subsede → Congregação → Turma
- Controle de acesso baseado em papel (RBAC) com escopo de dados por nível
- Cadastro de turmas, alunos e usuários (professores, pastores, gestores)
- Registro de aulas (lição + data) e lançamento de frequência com checklist de presença
- Login simplificado "de um clique" por papel, sem necessidade de cadastro
- Reset automático de dados via cron job (diário) para manter a demo sempre limpa

---

## Arquitetura

### Modelagem de domínio

```
Sede
 └── Subsede
      └── Congregação
           └── Turma de EBD
                ├── Professor(es)
                ├── Alunos
                └── Registros de Aula (lição + presença)
```

### RBAC — papéis e escopo

| Papel | Escopo | Permissões |
|---|---|---|
| Admin Geral | Sede | Acesso total: todas as Subsedes, Congregações, Turmas e Usuários |
| Gestor de Subsede | Subsede | Gerencia Congregações, Turmas e Usuários da sua Subsede |
| Pastor de Congregação | Congregação | Gerencia Turmas, Alunos e Professores da sua Congregação |
| Professor | Turma | Lança frequência e gerencia alunos da sua Turma |

O escopo de cada papel é resolvido a nível de query (não apenas de UI), garantindo
que, por exemplo, um Gestor de Subsede nunca consiga visualizar dados de outra
Subsede — mesmo manipulando a URL diretamente.

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 15 (App Router, TypeScript strict) |
| ORM | Prisma 6 |
| Banco de dados | PostgreSQL serverless (Neon) |
| Autenticação | JWT via `jose` (cookie httpOnly) |
| Testes | Vitest (19 testes unitários de RBAC) |
| Deploy | Vercel (free tier) |
| Reset de dados | Vercel Cron Job → `POST /api/reset-demo` |

### Estrutura de pastas

```
ebd-planner-demo/
├── app/
│   ├── (auth)/login/          → tela de login rápido por papel
│   ├── dashboard/             → home + telas por papel (RBAC)
│   │   ├── alunos/
│   │   ├── congregacoes/
│   │   ├── frequencia/
│   │   ├── subsedes/
│   │   ├── turmas/
│   │   └── usuarios/
│   └── api/                   → rotas REST (auth, turmas, alunos, usuários, aulas)
├── components/
│   ├── layout/sidebar.tsx
│   └── ui/                    → button, input, modal
├── lib/
│   ├── auth.ts                → sessão JWT (login sem senha)
│   ├── prisma.ts              → singleton do Prisma Client
│   └── rbac.ts                → helpers de escopo e permissão
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                → dados fictícios
├── __tests__/rbac.test.ts     → 19 testes unitários
└── vercel.json                → cron job diário
```

### Decisões técnicas relevantes

- **Prisma Client como singleton** (`lib/prisma.ts`): evita esgotamento de conexões
  em ambiente serverless, onde cada invocação poderia abrir uma nova conexão com o banco.
- **Login sem senha na demo**: autenticação real substituída por botões de "login rápido"
  por papel, usando usuários fictícios pré-criados no seed. Elimina fricção para avaliação
  sem comprometer a demonstração do RBAC.
- **RBAC resolvido na query**: os filtros Prisma (`where`) são gerados com base no papel
  e escopo do usuário (`lib/rbac.ts`), garantindo isolamento real dos dados.
- **Reset periódico via cron**: um Vercel Cron Job chama `/api/reset-demo` diariamente,
  re-executando o seed e restaurando o estado inicial da demo.
- **Dados 100% fictícios**: nomes, igrejas e endereços são genéricos — nenhum dado real
  de pessoa ou congregação é utilizado.

---

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (PostgreSQL gratuito)

### Passos

```bash
git clone https://github.com/MarcosMilhomem/ebd-planner-demo.git
cd ebd-planner-demo
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL, SESSION_SECRET e CRON_SECRET
```

### Variáveis de ambiente

```env
# Connection string do Neon ou Supabase (obrigatório)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Segredo JWT para cookies de sessão (mín. 32 chars)
# Gere com: openssl rand -base64 32
SESSION_SECRET="seu-segredo-forte-aqui"

# Segredo para proteger a rota /api/reset-demo
CRON_SECRET="outro-segredo-forte"
```

```bash
# Rodar migration e seed
npx prisma migrate dev
npx prisma db seed

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` e clique em um dos botões de login rápido.

### Testes

```bash
npm run test:run
# 19 testes unitários de RBAC — todos passando
```

---

## Deploy na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new)
2. Adicione as variáveis de ambiente nas configurações do projeto
3. O `vercel.json` já configura o cron job automaticamente

---

## Roadmap (versão real do produto)

Este projeto demo é a vitrine pública de um produto em desenvolvimento mais amplo,
construído com FastAPI + Prisma, incluindo recursos adicionais como:

- Relatórios consolidados por período e nível hierárquico
- Notificações de aniversário e ausência recorrente de alunos
- Gestão de materiais didáticos por lição
- Multi-tenant real (cada Sede como tenant isolado)

---

## Sobre

Projeto desenvolvido por **Marcos Milhomem** como parte de um portfólio de sistemas
voltados à gestão de organizações com estrutura hierárquica e controle de acesso granular.
