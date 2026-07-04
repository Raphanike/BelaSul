# 🛒 Bela Sul — Sistema de Controle de Pedidos

Sistema completo para controle de pedidos de mercado por cliente, feito com **React + Vite + Supabase**, com interface grande e simples, pensada para uso por pessoas idosas.

---

## 📁 O que está incluso

- App React completo (login, clientes, produtos, catálogo, pedidos, histórico, dashboard)
- Geração de PDF de pedido individual e relatório diário (com sua logo)
- Compartilhamento de pedido via WhatsApp
- Script SQL completo do banco de dados (`supabase/schema.sql`)
- Pronto para publicar na Vercel

---

## ✅ Passo 1 — Instalar no seu computador

1. Instale o [Node.js](https://nodejs.org/) (versão 18 ou superior) se ainda não tiver.
2. Extraia este arquivo `.zip` em uma pasta.
3. Abra a pasta no **VS Code**.
4. Abra o terminal do VS Code (menu `Terminal > New Terminal`) e rode:

```bash
npm install
```

---

## ✅ Passo 2 — Criar o projeto no Supabase (banco de dados gratuito)

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New Project**, escolha um nome (ex: `bela-sul`) e uma senha para o banco.
3. Aguarde a criação do projeto (leva 1-2 minutos).
4. No menu lateral, vá em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` (desta pasta), copie **todo o conteúdo** e cole no editor SQL do Supabase.
6. Clique em **Run** para criar todas as tabelas, índices e políticas de segurança.

### Criar o bucket de imagens dos produtos

1. No menu lateral do Supabase, vá em **Storage**.
2. Clique em **New bucket**.
3. Nome do bucket: `produtos`
4. Marque a opção **Public bucket** como **ativada**.
5. Clique em **Create bucket**.

> As políticas de acesso ao bucket já foram criadas pelo script SQL do passo anterior.

### Pegar as chaves de conexão

1. No menu lateral, vá em **Project Settings** (ícone de engrenagem) → **API**.
2. Copie o **Project URL** e a chave **anon public**.

---

## ✅ Passo 3 — Configurar o projeto com suas chaves

1. Na pasta do projeto, duplique o arquivo `.env.example` e renomeie a cópia para `.env`.
2. Abra o `.env` e preencha assim:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

3. Salve o arquivo.

---

## ✅ Passo 4 — Rodar o sistema no seu computador

No terminal do VS Code, rode:

```bash
npm run dev
```

Abra o navegador no endereço mostrado (normalmente `http://localhost:5173`).

Crie sua conta de acesso pela tela inicial (opção "Ainda não tenho conta") e comece a usar!

---

## ✅ Passo 5 — Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versão do sistema Bela Sul"
```

1. Crie um repositório novo no [GitHub](https://github.com/new) (ex: `bela-sul-pedidos`).
2. Rode os comandos que o próprio GitHub mostra na tela (algo como):

```bash
git remote add origin https://github.com/SEU-USUARIO/bela-sul-pedidos.git
git branch -M main
git push -u origin main
```

---

## ✅ Passo 6 — Publicar na Vercel (hospedagem gratuita)

1. Acesse [https://vercel.com](https://vercel.com) e crie uma conta (pode usar login do GitHub).
2. Clique em **Add New > Project**.
3. Selecione o repositório que você acabou de subir no GitHub.
4. Em **Environment Variables**, adicione as mesmas duas variáveis do seu `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**.
6. Em cerca de 1 minuto seu sistema estará no ar, com um link tipo `https://bela-sul-pedidos.vercel.app`.

---

## 🗂 Estrutura do projeto

```
src/
  assets/           → logo da empresa
  components/       → componentes reutilizáveis (Modal, Layout, Cards, etc.)
  hooks/            → hooks personalizados (autenticação, debounce)
  pages/            → páginas do sistema (Login, Dashboard, Clientes, Produtos, Pedido, Histórico)
  services/         → comunicação com o Supabase (clientes, produtos, pedidos)
  utils/            → geração de PDF, formatação de moeda/data, WhatsApp
  styles/           → estilos globais (cores e tipografia grandes)
supabase/
  schema.sql        → script completo do banco de dados
```

## 🔒 Segurança

Todas as tabelas usam **Row Level Security (RLS)**: apenas usuários autenticados (que fizeram login no sistema) podem ler ou alterar os dados. Sem login, nenhum dado é acessível.

## 🧮 Sobre os cálculos

Todos os valores (subtotal de cada item e total do pedido) são calculados automaticamente no momento da adição/edição de cada produto no carrinho, com arredondamento correto de 2 casas decimais, evitando erros comuns de ponto flutuante.

## 🖨 PDFs gerados

- **Pedido individual**: logo, nome do cliente, data/hora, lista de produtos com quantidade/peso, valor unitário, subtotal de cada item e total — pronto para impressão em A4.
- **Relatório diário**: todos os pedidos do dia, valor total por cliente e valor total geral do dia.

## 💬 Suporte

Qualquer dúvida na configuração do Supabase ou da Vercel, é só perguntar!
