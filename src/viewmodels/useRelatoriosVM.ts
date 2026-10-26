import { useMemo, useState } from "react";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import { buildReport } from "../models/reportSelectors";
import { usePagination } from "../hooks/usePagination";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  createDataIndexes,
  colaboradorNomeIndexed,
  beneficioDaUtilizacaoIndexed,
  conveniadoDaUtilizacaoIndexed,
  formatDate,
  statusLabel,
} from "../models/selectors";

export const REPORT_PAGE_SIZE = 8;
const dateOnly = (date: Date) => date.toLocaleDateString("sv-SE");

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}

function slicePage<T>(
  rows: T[],
  pagination: ReturnType<typeof usePagination>,
) {
  return {
    current: pagination.page,
    rows: rows.slice(pagination.start, pagination.end),
  };
}

export function useRelatoriosVM() {
  const { data } = usePortal();
  const { notify } = useToast();
  const now = new Date();
  const [inicio, setInicio] = useState(() =>
    dateOnly(new Date(now.getFullYear(), now.getMonth(), 1)),
  );
  const [fim, setFim] = useState(() => dateOnly(now));
  const [tab, setTab] = useState("utilizacoes");
  const report = useMemo(() => buildReport(data, inicio, fim), [data, inicio, fim]);
  const benefitPagination = usePagination(report.benefits.length, REPORT_PAGE_SIZE);
  const partnerPagination = usePagination(report.partners.length, REPORT_PAGE_SIZE);
  const periodPagination = usePagination(report.periods.length, REPORT_PAGE_SIZE);
  const campaignPagination = usePagination(report.campaigns.length, REPORT_PAGE_SIZE);

  const setPage = (value: number) => {
    benefitPagination.setPage(value);
    partnerPagination.setPage(value);
    periodPagination.setPage(value);
    campaignPagination.setPage(value);
  };

  const changeTab = (value: string) => {
    setTab(value);
    setPage(1);
  };

  const benefitPage = slicePage(report.benefits, benefitPagination);
  const partnerPage = slicePage(report.partners, partnerPagination);
  const periodPage = slicePage(report.periods, periodPagination);
  const campaignPage = slicePage(report.campaigns, campaignPagination);
  const delta = report.previous.length
    ? ((report.approved.length - report.previous.length) / report.previous.length) * 100
    : null;
  const statusCounts = Object.fromEntries(
    ["APROVADA", "PENDENTE", "REPROVADA", "ESTORNADA"].map((status) => [
      status,
      report.filtered.filter((usage) => usage.status === status).length,
    ]),
  );

  function exportar() {
    const headers = [
      "Registro", "Data da solicitação", "Colaborador", "Benefício ou item",
      "Conveniado", "Valor aplicado (R$)", "Status", "Canal de validação", "Observações",
    ];
    const indexes = createDataIndexes(data);
    const rows = report.filtered.map((usage) => [
      usage.id,
      formatDate(usage.data_solicitacao, true),
      colaboradorNomeIndexed(indexes, usage.colaborador_id),
      beneficioDaUtilizacaoIndexed(indexes, usage)?.nome ?? "Não encontrado",
      conveniadoDaUtilizacaoIndexed(indexes, usage)?.nome_fantasia ?? "Não encontrado",
      Number(usage.valor_aplicado).toFixed(2).replace(".", ","),
      statusLabel(usage.status),
      usage.canal_validacao ?? "",
      usage.observacoes ?? "",
    ]);
    const blob = new Blob(
      ["\uFEFF", [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fcv-utilizacoes-${inicio}-a-${fim}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`${report.filtered.length} registros exportados em CSV.`, "success");
  }

  return {
    inicio, fim, tab, setInicio, setFim, setPage, changeTab, report, delta,
    benefitPage, partnerPage, periodPage, campaignPage, statusCounts, exportar,
  };
}