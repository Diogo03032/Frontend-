# Portal de benefícios FCV - Grupo 3

Portal da Fundação Cristiano Varella em React, TypeScript, Vite e CSS convencional. O repositório recebido continha somente o README; por isso esta entrega inclui a base de login, visão geral e conveniados, além das seis páginas solicitadas.

Este repositório é exclusivo do **frontend web**. O backend é mantido separadamente em [joaovictorcascardo/fcv-backend](https://github.com/joaovictorcascardo/fcv-backend), responsável pela API, autenticação, regras do servidor e acesso ao MySQL com Knex. O portal consome essa API por HTTP; os dois projetos são executados e versionados separadamente.

## As seis páginas adicionadas

- **Colaboradores** (`/colaboradores`): pesquisa, filtros, paginação, cadastro, detalhes, edição e inativação, com vínculo a uma conta de colaborador.
- **Benefícios e ofertas** (`/beneficios`): cadastro, regras de ciclo/janela, edição, descontinuação e vínculos ativos/inativos com conveniados.
- **Utilizações** (`/utilizacoes`): filtros completos, detalhes e estorno de aprovação com motivo obrigatório. O registro continua no histórico.
- **Campanhas e eventos** (`/campanhas`): criação, edição, cancelamento, itens promocionais e conveniados vinculados.
- **Relatórios** (`/relatorios`): períodos, comparação, rankings, adesão, sazonalidade e exportação de utilizações em CSV.
- **Perfis e usuários** (`/perfis`): consulta, criação, edição e inativação de contas/perfis, com acesso exclusivo do administrador FCV.

Telas de base: Login (`/login`), Visão geral (`/`) e Conveniados (`/conveniados`). Não há Tailwind ou Prisma neste front-end; a API existente permanece com Knex e MySQL.

O avatar no cabeçalho e na barra lateral abre **Meu perfil** (`/meu-perfil`), com nome, e-mail, perfil de acesso, status e data de criação da conta conectada, recebidos da API. A consulta está disponível para administrador e operador; a gestão de todas as contas continua restrita ao administrador em `/perfis`.

## Executar localmente

Requer Node.js 22.12 ou mais recente e npm.

```bash
npm ci
npm run dev
```

Abra o endereço exibido no terminal (por padrão `http://127.0.0.1:5173`). O backend deve estar em execução para entrar e carregar os dados. O portal usa exclusivamente a API real, sem modo de demonstração ou armazenamento local de cadastros.

## Conectar à API real

Execute o serviço do repositório `fcv-backend` em seu próprio ambiente, seguindo o README dele. Neste frontend, copie `.env.example` para `.env.local` e configure `VITE_API_URL` com o endereço desse serviço, por exemplo `http://localhost:3333/api/v1`. Reinicie o servidor Vite após alterar variáveis.

O botão Entrar envia e-mail/senha a `/auth/login`. O portal aceita somente usuário ativo com escopo FCV; usa Bearer JWT nas requisições, guarda a sessão em `sessionStorage`, restaura via `/auth/eu` e limpa a sessão ao receber 401. Logout apaga o token. Nunca copie `JWT_SEGREDO`, senha do MySQL ou outra credencial do servidor para uma variável `VITE_*`.

As seeds de desenvolvimento do backend disponibilizam `admin@fcv.org.br` e `operador@fcv.org.br`, com senha `123456`. São contas locais de teste; configure contas próprias antes de publicar o ambiente. O login aceita e-mail, conforme o contrato atual da API.

A integração foi verificada com o backend e MySQL locais, incluindo autenticação, consultas e edição persistida. Veja [integração e limites](docs/INTEGRACAO.md).

## Organização MVVM

- `src/pages/` e `src/components/`: View, incluindo formulários e navegação.
- `src/viewmodels/`: sessão, estado compartilhado, carregamento e comandos de persistência.
- `src/models/`: contratos de dados, seletores e cálculos puros de indicadores.
- `src/services/`: comunicação REST com a API central.
- `src/styles/`: componentes, identidade da referência, notificações, acabamento e layout responsivo em CSS.

O portal reutiliza componentes de campos, tabelas, modal nativo com foco/teclado, indicadores, status, pesquisa e paginação. Marca e fotografia foram extraídas do WEB.pdf fornecido, em WebP. As imagens preservam a proporção e têm limites de tamanho; a fotografia lateral é ocultada em telas de até 800 px. A resolução disponível é a do PDF: arquivos institucionais originais podem melhorar a nitidez em telas de alta densidade.

O sino no topo abre um modal com as utilizações pendentes, contador e atalhos para cada registro ou para a lista filtrada. O botão Atualizar consulta novamente a API; o contador representa pendências atuais. O acabamento visual e as animações de entrada/transições usam apenas CSS, sem novas dependências, respeitando `prefers-reduced-motion`.

## Verificações

```bash
npm test
npm run build
npm run preview
```

Os testes de domínio cobrem relatórios por data/status, estornos, vínculos regulares/promocionais, restrição de administrador, filtro de período e integridade das fixtures de teste. Essas fixtures ficam exclusivamente em `tests/`.

A verificação em Chromium usa o backend e MySQL reais: login, senha incorreta, restauração de sessão, rejeição de token inválido, logout, restrição do operador, busca e edição de benefício persistida no banco, com restauração do valor original. As oito telas internas foram conferidas em 320, 390, 768, 1024 e 1440 px. O login foi conferido também em 1920 px. Não foram usadas respostas de API interceptadas nessa verificação.

O modal de notificações foi verificado com pendências reais: contador, atualização, links, detalhe por ID exato, teclado e retorno do foco ao sino. Estados vazio e erro foram simulados apenas em sessões isoladas do navegador, sem alterar o banco. Também foram conferidos os layouts de desktop/celular e a desativação das animações com movimento reduzido.

Referências consideradas: WEB.pdf, MOBILE.pdf, documento de arquitetura, requisitos do Grupo 2 e atribuições dos grupos. A instrução atual do usuário é o desenvolvimento das seis telas web do Grupo 3; o documento de atribuições recebido também descreve uma fase anterior de banco de dados. CSS e Knex são as escolhas confirmadas pelo usuário.
