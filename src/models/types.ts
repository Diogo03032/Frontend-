export type Status = "ATIVO" | "INATIVO";
export type Escopo = "FCV" | "COLABORADOR" | "CONVENIADO";
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
export type PerfilAcesso = Perfil;
export interface Colaborador {
  id: number;
  usuario_id: number;
  matricula: string;
  setor: string;
  cargo: string;
  data_admissao: string;
  telefone?: string | null;
  status: "ATIVO" | "INATIVO" | "AFASTADO";
}
export interface Conveniado {
  id: number;
  usuario_id: number;
  nome_fantasia: string;
  razao_social: string;
  categoria: string;
  cnpj: string;
  endereco: string;
  status: "ATIVO" | "INATIVO" | "EM_ANALISE";
}
export interface Beneficio {
  id: number;
  nome: string;
  descricao?: string | null;
  status: "ATIVO" | "INATIVO" | "DESCONTINUADO";
  tipo_beneficio: "PERCENTUAL" | "VALOR_FIXO";
  valor: number;
  quantidade_maxima_utilizacoes: number;
  tipo_janela: "CALENDARIO_FIXO" | "JANELA_MOVEL";
  unidade_ciclo?: "ANO" | "MES" | "SEMANA" | null;
  dia_reset?: string | null;
  intervalo_valor?: number | null;
  intervalo_unidade?: "DIA" | "MES" | null;
  referencia_contagem?:
    "ULTIMA_UTILIZACAO" | "DATA_ADMISSAO_COLABORADOR" | null;
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
  tipo:
    | "CAMPANHA"
    | "EVENTO_INTERNO"
    | "EVENTO_PATROCINADO"
    | "VOUCHER"
    | "CORTESIA";
  descricao?: string | null;
  data_inicio: string;
  data_fim: string;
  criterio_elegibilidade?: string | null;
  patrocinador?: string | null;
  status: "PLANEJADA" | "ATIVA" | "ENCERRADA" | "CANCELADA";
}
export interface ItemCampanha {
  id: number;
  campanha_id: number;
  nome: string;
  descricao?: string | null;
  tipo_beneficio: "PERCENTUAL" | "VALOR_FIXO";
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
  canal_validacao?: "APP_CONVENIADO" | "TERMINAL_IOT" | null;
  status: "PENDENTE" | "APROVADA" | "REPROVADA" | "ESTORNADA";
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
