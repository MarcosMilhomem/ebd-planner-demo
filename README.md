# EBD Planner — Demo

> Versão demonstrativa pública do EBD Planner, sistema de gestão para Escola Bíblica
> Dominical (EBD) de igrejas. Criada para fins de portfólio — todos os dados são
> fictícios.

🔗 **Demo ao vivo:** _[link após deploy na Vercel]_
💻 **Código-fonte:** _[link do repositório]_

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
- Cadastro de alunos por turma
- Registro de aulas (lição + data) e lançamento de frequência
- Login simplificado "de um clique" por papel, sem necessidade de cadastro
- Reset automático de dados (cron job) para manter a demo sempre limpa

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
| Admin Geral | Sede | Acesso total: todas as Subsedes, Congregações e Turmas |
| Gestor de Subsede | Subsede | Gerencia Congregações e Turmas da sua Subsede |
| Pastor de Congregação | Congregação | Gerencia Turmas e Professores da sua Congregação |
| Professor | Turma | Lança frequência e gerencia alunos da sua Turma |

O escopo de cada papel é resolvido a nível de query (não apenas de UI), garantindo
que, por exemplo, um Gestor de Subsede nunca consiga visualizar dados de outra
Subsede — mesmo manipulando a URL diretamente.

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js (App Router, TypeScript) |
| ORM | Prisma |
| Banco de dados | PostgreSQL serverless (Neon / Supabase) |
| Deploy | Vercel (free tier) |
| Reset de dados | Vercel Cron Job → rota `/api/reset-demo` |

### Decisões técnicas relevantes

- **Prisma Client como singleton** (`lib/prisma.ts`): evita esgotamento de conexões
  em ambiente serverless, onde cada invocação de função poderia abrir uma nova
  conexão com o banco.
- **Login sem senha na demo**: como o objetivo é demonstração pública, a autenticação
  real foi substituída por botões de "login rápido" por papel, usando usuários
  fictícios pré-criados no seed. Isso elimina fricção para quem está avaliando o
  projeto sem comprometer a demonstração do RBAC.
- **Reset periódico via cron**: qualquer visitante pode alterar dados durante a
  demonstração; um job agendado restaura o estado inicial automaticamente,
  re-executando o script de seed.
- **Dados 100% fictícios**: nomes, igrejas e endereços são genéricos, gerados
  especificamente para esta demo — nenhum dado real de pessoa ou congregação é
  utilizado.

---

## Como rodar localmente

```bash
git clone <repo>
cd ebd-planner-demo
npm install

# configurar variável de ambiente
cp .env.example .env
# editar DATABASE_URL com sua connection string (Neon/Supabase)

npx prisma migrate dev
npx prisma db seed

npm run dev
```

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
voltados à gestão de organizações com estrutura hierárquica e controle de acesso
granular.
