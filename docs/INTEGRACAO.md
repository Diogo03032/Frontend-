# Contrato de integração e limites da entrega

## API utilizada

Backend mantido no repositório [joaovictorcascardo/fcv-backend](https://github.com/joaovictorcascardo/fcv-backend). Este repositório contém somente o portal web e seu cliente REST. API, autenticação no servidor, Knex, migrations, seeds e acesso ao banco pertencem ao backend separado.

Base configurável em `VITE_API_URL`; padrão `http://localhost:3333/api/v1` para o serviço backend local. Em outro ambiente, essa variável deve apontar para o endereço publicado do mesmo serviço. O navegador acessa a API por HTTP, sem conexão direta ao banco.

- Autenticação: POST `/auth/login`, GET `/auth/eu`.
- Cadastros: `/usuarios`, `/perfis`, `/colaboradores`, `/conveniados`, `/beneficios`.
- Vínculos: `/ofertas`, `/itens-campanha`, `/ofertas-campanha`.
- Operação: `/campanhas`, `/utilizacoes`.

GET carrega as listas. POST cria e PUT envia os campos de atualização. O portal não usa DELETE para utilizações ou cadastros; utiliza inativação, descontinuação e cancelamento por status, preservando as relações e o histórico. O estorno envia `status: ESTORNADA` e `observacoes` com o motivo ao PUT da utilização, sem alterar valor, colaborador ou data original.

Nomes de colaboradores são compostos com usuário vinculado. Os vínculos de utilização distinguem benefício regular e item promocional, mesmo quando os IDs coincidem. Categorias nos relatórios são do conveniado; não foi inventado campo de categoria em benefício ou CPF em colaborador.

## Dependências do backend, fora da alteração deste front-end

1. RF37/RNF03: a API atual verifica escopo FCV em usuários/perfis. Ainda precisa diferenciar administrador de operador no servidor. O portal faz a restrição de interface e comandos, mas isso não substitui a autorização na API.
2. RF03: o backend deve validar status do usuário, perfil e colaborador/conveniado quando aplicável. A verificação atual do login observado cobre o usuário.
3. RF43/RNF17: a API deve proteger utilizações decididas contra edição/exclusão e controlar estornos concorrentes. O portal só oferece estorno com motivo para APROVADA e não exclui histórico.
4. RNF08: as listas atuais da API retornam tudo. Filtros e paginação do portal são locais; para escala, o backend precisa de consultas paginadas/filtradas.
5. Criar colaborador/conveniado pressupõe uma conta existente do escopo correspondente, ainda sem vínculo. Contas são criadas pelo administrador em Perfis e usuários. O operador pode vincular contas disponibilizadas pelo administrador.
6. A lista de permissões dos perfis é metadado persistido. O backend deve aplicá-la; o front-end não apresenta a edição dessa lista como autorização suficiente no servidor.

## Indicadores

Os indicadores usam apenas APROVADA para contagens/valor, excluindo reprovações, pendências e estornos. Os registros continuam disponíveis no histórico e CSV.

Adesão observada por benefício usa colaboradores atualmente ativos com uso aprovado dividido pela base de colaboradores atualmente ativos. Custo médio usa valor aplicado dividido por participantes únicos. A página informa as fórmulas e a limitação da base atual. Esses indicadores não demonstram elegibilidade passada, custo contábil ou aprovação de fórmulas finais pelo Grupo 2.

## Autenticação

Frontend: somente FCV ativo, Bearer JWT, sessão no `sessionStorage`, consulta `/auth/eu`, saída em 401 e logout. Não há refresh porque o backend analisado não o fornece. A recuperação de senha que devolve o código na resposta não foi apresentada como fluxo definitivo na interface.

Para um ambiente publicado, usar HTTPS, origens CORS adequadas e validação de permissões no servidor. Credenciais de banco/JWT permanecem exclusivamente no backend com Knex. Nenhuma migration, seed ou configuração de banco foi alterada nesta entrega.

## Escopo visual

A identidade segue a referência FCV com azul, superfícies claras, sidebar, cartões, filtros, tabelas, badges e modais. Layout adaptado para 1366 px e telas menores, português brasileiro, rótulos de ação, navegação por teclado, estados vazio/erro/carregamento e preferência por movimento reduzido.

Auditoria geral RF38 e PDF de exportação RF36 não foram implementados. São Could; o CSV foi incluído. A proteção do histórico de utilizações, distinta da trilha geral, foi preservada no front-end.

## Verificação real versus simulada

A compilação e os testes de seletores foram executados. Os testes do navegador usaram a aplicação real em modo de demonstração para navegação/cadastro/estorno/CSV, e respostas REST interceptadas para verificar o contrato, Bearer token, restauração e expiração da sessão. O login e o banco MySQL real ainda precisam de homologação com o ambiente do Grupo 2.
