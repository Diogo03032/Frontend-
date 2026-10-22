export type Status = "ATIVO" | "INATIVO";
export type Escopo = "FCV" | "COLABORADOR" | "CONVENIADO";

export type ColaboradorStatus = "ATIVO" | "INATIVO" | "AFASTADO";
export type ConveniadoStatus = "ATIVO" | "INATIVO" | "EM_ANALISE";
export type BeneficioStatus = "ATIVO" | "INATIVO" | "DESCONTINUADO";
export type CampanhaStatus = "PLANEJADA" | "ATIVA" | "ENCERRADA" | "CANCELADA";
export type UtilizacaoStatus = "PENDENTE" | "APROVADA" | "REPROVADA" | "ESTORNADA";

export type TipoBeneficio = "PERCENTUAL" | "VALOR_FIXO";
export type TipoJanela = "CALENDARIO_FIXO" | "JANELA_MOVEL";
export type UnidadeCiclo = "ANO" | "MES" | "SEMANA";
export type IntervaloUnidade = "DIA" | "MES";
export type ReferenciaContagem = "ULTIMA_UTILIZACAO" | "DATA_ADMISSAO_COLABORADOR";
export type CanalValidacao = "APP_CONVENIADO" | "TERMINAL_IOT";

export type CampanhaTipo =
  | "CAMPANHA"
  | "EVENTO_INTERNO"
  | "EVENTO_PATROCINADO"
  | "VOUCHER"
  | "CORTESIA";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil_id: number;
  status: Status;
  data_criacao?: string;
  senha?: string;
  perfil?: string;
  escopo?: Escopo;
}

export interface Perfil {
  id: number;
  nome: string;
  escopo: Escopo;
  descricao?: string | null;
  permissoes?: string[] | null;
  status: Status;
}

/**
 * @deprecated Use Perfil diretamente. Mantido por retrocompatibilidade.
 */
export type PerfilAcesso = Perfil;

export interface Colaborador {
  id: number;
  usuario_id: number;
  matricula: string;
  setor: string;
  cargo: string;
  data_admissao: string;
  telefone?: string | null;
  status: ColaboradorStatus;
}

export interface Conveniado {
  id: number;
  usuario_id: number;
  nome_fantasia: string;
  razao_social: string;
  categoria: string;
  cnpj: string;
  endereco: string;
  status: ConveniadoStatus;
}

export interface Beneficio {
  id: number;
  nome: string;
  descricao?: string | null;
  status: BeneficioStatus;
  tipo_beneficio: TipoBeneficio;
  valor: number;
  quantidade_maxima_utilizacoes: number;
  tipo_janela: TipoJanela;
  unidade_ciclo?: UnidadeCiclo | null;
  dia_reset?: string | null;
  intervalo_valor?: number | null;
  intervalo_unidade?: IntervaloUnidade | null;
  referencia_contagem?: ReferenciaContagem | null;
}

export interface Oferta {
  id: number;
  beneficio_id: number;
  conveniado_id: number;
  status: Status;
}

export interface Campanha {
  id: number;
  nome: string;
  tipo: CampanhaTipo;
  descricao?: string | null;
  data_inicio: string;
  data_fim: string;
  criterio_elegibilidade?: string | null;
  patrocinador?: string | null;
  status: CampanhaStatus;
}

export interface ItemCampanha {
  id: number;
  campanha_id: number;
  nome: string;
  descricao?: string | null;
  tipo_beneficio: TipoBeneficio;
  valor: number;
  quantidade_maxima_utilizacoes?: number | null;
  status: Status;
}

export interface OfertaCampanha {
  id: number;
  beneficio_campanha_id: number;
  conveniado_id: number;
  status: Status;
}

export interface Utilizacao {
  id: number;
  colaborador_id: number;
  beneficio_conveniado_id?: number | null;
  beneficio_campanha_conveniado_id?: number | null;
  token_qrcode: string;
  data_solicitacao: string;
  data_confirmacao?: string | null;
  valor_aplicado: number;
  canal_validacao?: CanalValidacao | null;
  status: UtilizacaoStatus;
  observacoes?: string | null;
}

export interface PortalData {
  usuarios: Usuario[];
  perfis: Perfil[];
  colaboradores: Colaborador[];
  conveniados: Conveniado[];
  beneficios: Beneficio[];
  ofertas: Oferta[];
  campanhas: Campanha[];
  itensCampanha: ItemCampanha[];
  ofertasCampanha: OfertaCampanha[];
  utilizacoes: Utilizacao[];
}

export type Resource = keyof PortalData;
export type Entity<K extends Resource> = PortalData[K][number];

export interface SessionUser extends Usuario {
  perfil: string;
  escopo: Escopo;
}

// Estruturas de agregação e indicadores de domínio
export interface BenefitReportItem {
  key: string;
  nome: string;
  origem: string;
  status: string;
  count: number;
  participantes: number;
  valor: number;
  taxa: number;
}

export interface PartnerReportItem {
  id: number;
  nome: string;
  categoria: string;
  count: number;
  participantes: number;
  valor: number;
}

export interface CategoryReportItem {
  nome: string;
  count: number;
}

export interface PeriodReportItem {
  key: string;
  nome: string;
  count: number;
  registros: number;
  participantes: number;
  valor: number;
}

export interface CampaignReportItem {
  id: number;
  nome: string;
  count: number;
  participantes: number;
  taxa: number;
}

export interface ReportResult {
  valid: boolean;
  filtered: Utilizacao[];
  approved: Utilizacao[];
  totalValor: number;
  participantes: number;
  ativos: number;
  ativosParticipantes: number;
  taxaAdesao: number;
  custoMedio: number;
  previous: Utilizacao[];
  previousStart: string;
  previousEnd: string;
  benefits: BenefitReportItem[];
  partners: PartnerReportItem[];
  categories: CategoryReportItem[];
  periods: PeriodReportItem[];
  campaigns: CampaignReportItem[];
}
