# 100 Receio

Caderno de receitas em HTML semântico, CSS e JavaScript Vanilla com módulos ES, Supabase Auth/Database, SweetAlert2 e Lucide Icons. O servidor local/produção usa módulos nativos do Node.js, sem dependências npm adicionais.

## Requisitos

- Node.js 18 ou superior e npm.
- Um projeto Supabase para autenticação e persistência.

## Supabase e variáveis de ambiente

1. No painel Supabase, execute `supabase/schema.sql` pelo SQL Editor. O schema define receitas, categorias, ingredientes, etapas e favoritos com RLS.
2. Obtenha a URL do projeto e a chave pública `anon`/publishable em **Project Settings → API**.
3. Localmente, copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores do seu projeto. O exemplo contém placeholders; nenhuma credencial é incluída no repositório.
4. Em **Authentication → URL Configuration**, permita a origem local e a URL final do serviço Render para os redirects de autenticação.

O servidor gera `/js/config.js` em tempo de execução. A chave anon/publishable é pública e chega ao navegador; o servidor rejeita chaves `sb_secret_*` e JWTs com papel `service_role`. Não coloque chaves privilegiadas no `.env`, nas variáveis do Render ou em arquivos versionados. A autorização continua nas políticas RLS do Supabase.

## Executar localmente no PowerShell

Na raiz do repositório, execute:

```powershell
npm.cmd install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
npm.cmd run dev
```

Preencha e salve `.env` antes de usar as funções do Supabase. O modo `dev` usa a porta `4173` por padrão; pode ser alterada com a variável `PORT`. Abra `http://127.0.0.1:4173` e encerre o servidor com `Ctrl+C`.

## Preparar uma Web Service na Render (sem deploy neste passo)

1. Envie este repositório para o GitHub. Ele pode permanecer **privado**.
2. No painel Render, conecte sua conta GitHub e conceda acesso ao repositório privado escolhido.
3. Crie **New → Web Service**, selecione o repositório e a branch de publicação. Use a raiz do repositório como **Root Directory**.
4. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
5. Em **Environment Variables**, adicione `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores públicos do projeto Supabase. Não configure `service_role`. A Render fornece `PORT`; o servidor usa essa variável em produção e escuta em `0.0.0.0`, mantendo `4173` como fallback local.
6. Antes de habilitar o serviço, adicione a URL `https://<nome-do-servico>.onrender.com/**` à lista de redirects permitidos em **Supabase → Authentication → URL Configuration**. Use também o domínio personalizado, se houver.

Não é necessário enviar `.env` à Render: a configuração é fornecida pelas variáveis de ambiente do serviço. O endpoint `/js/config.js` entrega somente a URL e a chave pública ao browser; os arquivos `.env` não são servidos como estáticos. Estes passos apenas preparam a configuração; nenhum serviço foi criado ou publicado.

## Segurança e arquivos ignorados

O `.gitignore` exclui `.env`, arquivos `.env.*` (mantendo `.env.example`), `js/config.js`, `node_modules`, chaves/certificados privados (`*.pem`, `*.key`, `*.p12`, `*.pfx`) e arquivos de credenciais de service account. Não versionar arquivos secretos. Se algum segredo já tiver sido commitado, removê-lo do `.gitignore` não basta: revogue/rotacione a credencial e remova o arquivo do histórico do Git.

## Funcionalidades

- Página inicial com receitas públicas, busca e filtro por categoria.
- Cadastro, login, logout e recuperação de senha via Supabase Auth.
- Receitas próprias, formulário de criação/edição, detalhes e exclusão confirmada.
- Ingredientes e etapas de preparo em listas editáveis e ordenadas.
- Favoritos de receitas públicas de outras pessoas e compartilhamento de links públicos.
- Estados vazios, de carregamento, sucesso e erro em português; layout responsivo e acessível.

## Limitações

- Imagens são informadas por URL; upload de arquivos não está implementado.
- Supabase JS, SweetAlert2, Lucide e fontes são carregados por CDN, portanto o navegador precisa de internet.
- É necessário configurar o projeto Supabase e suas URLs de Auth manualmente; o schema/RLS não é alterado pelo servidor.
