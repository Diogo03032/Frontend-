import type { PortalData } from "../../src/models/types";
const date = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
export function createFixtureData(): PortalData {
  const nomes = [
    "Ana Carolina Silva",
    "João Pedro Santos",
    "Mariana Ferreira",
    "Rafael Souza",
    "Larissa Teixeira",
    "Bruno Ribeiro",
    "Camila Lopes",
    "Victor Silva",
    "Fernanda Alves",
    "Matheus Oliveira",
  ];
  const partners = [
    "Sabor & Cia Restaurante",
    "Farmácia Vida",
    "Academia FitLife",
    "Ótica Visão",
    "Cinema Premium",
    "Centro de Estudos",
  ];
  const usuarios = [
    {
      id: 1,
      nome: "Ana Beatriz Santos",
      email: "admin@fcv.org.br",
      perfil_id: 1,
      status: "ATIVO" as const,
    },
    {
      id: 2,
      nome: "Bruno Operador",
      email: "operador@fcv.org.br",
      perfil_id: 2,
      status: "ATIVO" as const,
    },
    ...nomes.map((nome, i) => ({
      id: i + 3,
      nome,
      email: `colaborador${i + 1}@exemplo.fcv`,
      perfil_id: 3,
      status: "ATIVO" as const,
    })),
    ...partners.map((nome, i) => ({
      id: i + 13,
      nome,
      email: `parceiro${i + 1}@exemplo.fcv`,
      perfil_id: 4,
      status: "ATIVO" as const,
    })),
  ];
  usuarios.push(
    {
      id: 19,
      nome: "Renata Alves",
      email: "renata@exemplo.fcv",
      perfil_id: 3,
      status: "ATIVO",
    },
    {
      id: 20,
      nome: "Padaria Pão Bom",
      email: "padaria@exemplo.fcv",
      perfil_id: 4,
      status: "ATIVO",
    },
  );
  return {
    usuarios,
    perfis: [
      {
        id: 1,
        nome: "FCV_ADMINISTRADOR",
        escopo: "FCV",
        descricao: "Gestão completa, incluindo usuários e perfis",
        permissoes: ["tudo"],
        status: "ATIVO",
      },
      {
        id: 2,
        nome: "FCV_OPERADOR",
        escopo: "FCV",
        descricao: "Cadastros, campanhas e acompanhamento de benefícios",
        permissoes: ["cadastros", "campanhas", "utilizacoes"],
        status: "ATIVO",
      },
      {
        id: 3,
        nome: "COLABORADOR",
        escopo: "COLABORADOR",
        descricao: "Carteira e histórico pessoal no aplicativo",
        permissoes: ["carteira", "qrcode", "historico"],
        status: "ATIVO",
      },
      {
        id: 4,
        nome: "CONVENIADO",
        escopo: "CONVENIADO",
        descricao: "Validação e histórico do estabelecimento no aplicativo",
        permissoes: ["validar", "historico_estabelecimento"],
        status: "ATIVO",
      },
    ],
    colaboradores: nomes.map((_, i) => ({
      id: i + 1,
      usuario_id: i + 3,
      matricula: `FCV${String(4500 + i * 37).padStart(4, "0")}`,
      setor: [
        "Administrativo",
        "Tecnologia da Informação",
        "Enfermagem",
        "Serviços Gerais",
        "Farmácia",
      ][i % 5],
      cargo: [
        "Assistente administrativo",
        "Analista de TI",
        "Enfermeiro",
        "Auxiliar de serviços",
        "Farmacêutico",
      ][i % 5],
      data_admissao: `202${1 + (i % 5)}-03-10`,
      telefone: `3298888${String(i + 1000)}`,
      status: i === 3 ? "INATIVO" : i === 7 ? "AFASTADO" : "ATIVO",
    })),
    conveniados: partners.map((nome, i) => ({
      id: i + 1,
      usuario_id: i + 13,
      nome_fantasia: nome,
      razao_social: `${nome} Ltda.`,
      categoria: [
        "Alimentação",
        "Saúde",
        "Esporte e lazer",
        "Saúde",
        "Cultura e lazer",
        "Educação",
      ][i],
      cnpj: [
        "12345678000190",
        "98765432000110",
        "66777888000155",
        "11222333000144",
        "22333444000122",
        "33444555000166",
      ][i],
      endereco: `${["Av. Brasil, 123", "Rua das Flores, 456", "Rua do Sol, 321", "Av. Paulista, 1000", "Rua Central, 789", "Av. Independência, 987"][i]} · Muriaé, MG`,
      status: i === 3 ? "INATIVO" : i === 5 ? "EM_ANALISE" : "ATIVO",
    })),
    beneficios: [
      {
        id: 1,
        nome: "Alimentação",
        descricao: "Desconto em refeições nos estabelecimentos parceiros.",
        status: "ATIVO",
        tipo_beneficio: "PERCENTUAL",
        valor: 15,
        quantidade_maxima_utilizacoes: 8,
        tipo_janela: "CALENDARIO_FIXO",
        unidade_ciclo: "MES",
      },
      {
        id: 2,
        nome: "Saúde e bem-estar",
        descricao: "Mais cuidado com a saúde, em cada etapa da vida.",
        status: "ATIVO",
        tipo_beneficio: "PERCENTUAL",
        valor: 20,
        quantidade_maxima_utilizacoes: 4,
        tipo_janela: "CALENDARIO_FIXO",
        unidade_ciclo: "MES",
      },
      {
        id: 3,
        nome: "Cultura e lazer",
        descricao: "Momentos de diversão com descontos em ingressos.",
        status: "ATIVO",
        tipo_beneficio: "VALOR_FIXO",
        valor: 20,
        quantidade_maxima_utilizacoes: 2,
        tipo_janela: "CALENDARIO_FIXO",
        unidade_ciclo: "MES",
      },
      {
        id: 4,
        nome: "Atividade física",
        descricao: "Benefício para cuidar do corpo e da mente.",
        status: "ATIVO",
        tipo_beneficio: "PERCENTUAL",
        valor: 25,
        quantidade_maxima_utilizacoes: 1,
        tipo_janela: "JANELA_MOVEL",
        intervalo_valor: 1,
        intervalo_unidade: "MES",
        referencia_contagem: "ULTIMA_UTILIZACAO",
      },
      {
        id: 5,
        nome: "Educação",
        descricao: "Novas oportunidades de aprendizado e crescimento.",
        status: "INATIVO",
        tipo_beneficio: "PERCENTUAL",
        valor: 15,
        quantidade_maxima_utilizacoes: 1,
        tipo_janela: "CALENDARIO_FIXO",
        unidade_ciclo: "ANO",
      },
      {
        id: 6,
        nome: "Cuidado odontológico",
        descricao: "Desconto em consultas e procedimentos preventivos.",
        status: "ATIVO",
        tipo_beneficio: "PERCENTUAL",
        valor: 10,
        quantidade_maxima_utilizacoes: 2,
        tipo_janela: "CALENDARIO_FIXO",
        unidade_ciclo: "ANO",
      },
    ],
    ofertas: [
      { id: 1, beneficio_id: 1, conveniado_id: 1, status: "ATIVO" },
      { id: 2, beneficio_id: 2, conveniado_id: 2, status: "ATIVO" },
      { id: 3, beneficio_id: 3, conveniado_id: 5, status: "ATIVO" },
      { id: 4, beneficio_id: 4, conveniado_id: 3, status: "ATIVO" },
      { id: 5, beneficio_id: 5, conveniado_id: 6, status: "INATIVO" },
      { id: 6, beneficio_id: 6, conveniado_id: 4, status: "ATIVO" },
    ],
    campanhas: [
      {
        id: 1,
        nome: "Cuidar de quem cuida",
        tipo: "CAMPANHA",
        descricao: "Um período dedicado ao bem-estar dos nossos colaboradores.",
        data_inicio: date(-15),
        data_fim: date(30),
        criterio_elegibilidade: "Colaboradores ativos",
        status: "ATIVA",
      },
      {
        id: 2,
        nome: "Encontro de saúde e prevenção",
        tipo: "EVENTO_INTERNO",
        descricao: "Informação, acolhimento e prevenção em um só encontro.",
        data_inicio: date(12),
        data_fim: date(12),
        criterio_elegibilidade: "Todos os colaboradores",
        status: "PLANEJADA",
      },
      {
        id: 3,
        nome: "Semana da família FCV",
        tipo: "CAMPANHA",
        descricao: "Benefícios especiais para compartilhar bons momentos.",
        data_inicio: date(-60),
        data_fim: date(-45),
        status: "ENCERRADA",
      },
    ],
    itensCampanha: [
      {
        id: 1,
        campanha_id: 1,
        nome: "Check-up preventivo",
        tipo_beneficio: "PERCENTUAL",
        valor: 30,
        quantidade_maxima_utilizacoes: 1,
        status: "ATIVO",
      },
      {
        id: 2,
        campanha_id: 1,
        nome: "Alimentação saudável",
        tipo_beneficio: "PERCENTUAL",
        valor: 20,
        quantidade_maxima_utilizacoes: 2,
        status: "ATIVO",
      },
    ],
    ofertasCampanha: [
      { id: 1, beneficio_campanha_id: 1, conveniado_id: 2, status: "ATIVO" },
      { id: 2, beneficio_campanha_id: 2, conveniado_id: 1, status: "ATIVO" },
    ],
    utilizacoes: [
      ...Array.from({ length: 36 }, (_, i) => ({
        id: i + 1,
        colaborador_id: (i % 10) + 1,
        beneficio_conveniado_id: (i % 6) + 1,
        beneficio_campanha_conveniado_id: null,
        token_qrcode: `demonstracao-resgate-${i + 1}`,
        data_solicitacao: `${date(-i * 2 - 1)}T${String(9 + (i % 8)).padStart(2, "0")}:30:00`,
        data_confirmacao:
          i % 7 === 0
            ? null
            : `${date(-i * 2 - 1)}T${String(9 + (i % 8)).padStart(2, "0")}:31:00`,
        valor_aplicado: [12.6, 24.8, 20, 50, 38, 15][i % 6],
        canal_validacao: (i % 3 === 0 ? "TERMINAL_IOT" : "APP_CONVENIADO") as
          "TERMINAL_IOT" | "APP_CONVENIADO",
        status: (i % 7 === 0
          ? "PENDENTE"
          : i % 11 === 0
            ? "REPROVADA"
            : i % 13 === 0
              ? "ESTORNADA"
              : "APROVADA") as
          "PENDENTE" | "REPROVADA" | "ESTORNADA" | "APROVADA",
        observacoes:
          i % 13 === 0 && i % 7 !== 0
            ? "Estorno de exemplo: solicitação duplicada."
            : null,
      })),
      {
        id: 37,
        colaborador_id: 1,
        beneficio_conveniado_id: null,
        beneficio_campanha_conveniado_id: 1,
        token_qrcode: "demonstracao-campanha-37",
        data_solicitacao: `${date(-4)}T10:30:00`,
        data_confirmacao: `${date(-4)}T10:31:00`,
        valor_aplicado: 30,
        canal_validacao: "APP_CONVENIADO",
        status: "APROVADA",
      },
      {
        id: 38,
        colaborador_id: 3,
        beneficio_conveniado_id: null,
        beneficio_campanha_conveniado_id: 2,
        token_qrcode: "demonstracao-campanha-38",
        data_solicitacao: `${date(-6)}T11:30:00`,
        data_confirmacao: `${date(-6)}T11:31:00`,
        valor_aplicado: 20,
        canal_validacao: "TERMINAL_IOT",
        status: "APROVADA",
      },
    ],
  };
}
