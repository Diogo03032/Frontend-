# Seis telas de acompanhamento

As novas páginas complementam as áreas de gestão existentes e consomem o mesmo `PortalContext`, autenticado na API do repositório `joaovictorcascardo/fcv-backend`. O frontend continua usando React, TypeScript e CSS, sem dependências adicionais de interface ou gráficos.

## Navegação

1. **Perfil do colaborador — `/colaboradores/:id`**: aberto pelo nome ou ícone de visualização na lista de colaboradores. Mostra identidade, dados profissionais, status da conta vinculada, utilizações aprovadas, valor aplicado, pendências e relações com benefícios/campanhas.
2. **Painel do conveniado — `/conveniados/:id`**: aberto pela lista de conveniados ou por vínculos em outras telas. Reúne dados do estabelecimento, responsável, ofertas comuns/promocionais e histórico, incluindo os vínculos inativos.
3. **Detalhes do benefício — `/beneficios/:id`**: mostra valor percentual/fixo, limite, ciclo, janela de renovação, conveniados e respectivos status de vínculo/cadastro.
4. **Calendário — `/calendario`**: disponível no menu. Permite navegar entre meses, voltar a hoje, filtrar tipo/status e selecionar um dia para consultar a agenda. A criação abre o formulário existente de campanhas.
5. **Central de pendências — `/pendencias`**: disponível no menu, com contador. Agrega somente `EM_ANALISE` de conveniados e `PENDENTE` de utilizações. Permite pesquisar, filtrar, paginar, atualizar a API e abrir o registro exato.
6. **Detalhes de campanha/evento — `/campanhas/:id`**: aberto pela listagem ou calendário. Mostra período, tipo, status, critério de elegibilidade, patrocinador, itens e conveniados vinculados.

Os detalhes têm rotas próprias protegidas pelo login FCV, estados vazios e tratamento de identificadores inválidos ou registros ausentes. Administradores e operadores acessam essas consultas; a gestão de perfis continua exclusiva do administrador.

## Critérios dos indicadores

- Valores aplicados e contagens de utilizações aprovadas incluem apenas `APROVADA`. Estornos e reprovações permanecem no histórico, sem compor os totais financeiros.
- Os cartões de resumo consideram todo o histórico carregado do cadastro. Os gráficos mostram seis meses, até o momento atual, agrupados pelo mês da solicitação.
- Participantes de campanha são colaboradores distintos com pelo menos uma utilização aprovada de um item da campanha. A API não oferece uma lista separada de inscrições.
- Benefícios e campanhas no perfil do colaborador são derivados das solicitações registradas, em todos os status, conforme o texto exibido. Essas relações não representam uma autorização de uso ou saldo disponível.
- Benefícios comuns usam `ofertas`; itens promocionais usam `ofertasCampanha` e `itensCampanha`. IDs iguais entre essas coleções não misturam os históricos.
- Campanhas aparecem em todos os dias entre início e fim, inclusive. As datas do calendário são tratadas como dias locais, sem deslocamento por conversão UTC. Não são inventados horários ou locais ausentes na API.
- Colaboradores inativos ou afastados não são classificados como cadastros aguardando liberação: esse estado não existe no contrato atual.

## Ações e integração

As novas consultas reutilizam os formulários existentes por atalhos `?editar=ID`, `?ofertas=ID`, `?itens=ID` e `?novo=1`. Abrir esses links não altera os dados; a persistência ocorre somente ao confirmar o formulário.

O histórico e as pendências abrem a utilização exata por `/utilizacoes?utilizacao=ID`. A central não introduz aprovação de resgates pela equipe FCV: a confirmação permanece no fluxo do aplicativo do conveniado/terminal, conforme a API e as atribuições do projeto.

Nenhuma mudança do backend ou migração de banco é necessária para essas telas. A auditoria não faz parte desta entrega, pois exigiria registros adicionais de autoria e alterações no servidor.

## Validação

Execute `npm test` e `npm run build`.

Os testes de domínio verificam os indicadores existentes, separação dos tipos de oferta, identificadores de rota, busca/ordenação do histórico, seis meses na virada do ano, datas locais, anos bissextos, meses com quatro/cinco/seis semanas, vigências inclusivas, filtros e pendências sem colisão entre IDs de recursos diferentes.

Validação local concluída em 20/10/2026:

- `npm test`: 18 testes aprovados.
- `npm run build`: TypeScript e build de produção aprovados.
- Chrome headless 155: 69 verificações aprovadas com a API e o MySQL locais reais, em contexto descartável.
- Responsividade: seis telas nas larguras 320, 390, 768, 1024 e 1440 px, totalizando 30 combinações sem transbordamento horizontal do documento. Tabelas extensas mantêm rolagem interna.
- Login de administrador e operador, rotas protegidas, detalhes, IDs inválidos, histórico, métricas, calendário, filtros, pendências e gestão de vínculos conferidos. Os quatro atalhos de edição abriram os formulários com os dados corretos e foram fechados sem salvar.
- A restrição da gestão de perfis ao administrador foi preservada. Não houve erros JavaScript ou no console durante o teste.
- Os dez recursos da API foram comparados antes e depois: os dados permaneceram idênticos. A validação não cadastrou, editou ou excluiu registros.

Essa conferência local não substitui a validação do ambiente publicado ou a avaliação do professor. Não foram executados novos testes desta entrega em Safari ou Firefox.
