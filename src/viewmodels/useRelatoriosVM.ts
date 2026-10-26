import { useMemo, useState } from "react";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import { buildReport } from "../models/reportSelectors";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  formatDate,
  statusLabel,
} from "../models/selectors";

export const REPORT_PAGE_SIZE = 8;
const dateOnly = (date: Date) => date.toLocaleDateString("sv-SE");

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}

function paginate<T>(rows: T[], page: number) {
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(rows.length / REPORT_PAGE_SIZE)),
  );
  return {
    current,
    rows: rows.slice((current - 1) * REPORT_PAGE_SIZE, current * REPORT_PAGE_SIZE),
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
  const [page, setPage] = useState(1);
  const report = useMemo(() => buildReport(data, inicio, fim), [data, inicio, fim]);
  const changeTab = (value: string) => {
    setTab(value);
    setPage(1);
  };
  const benefitPage = paginate(report.benefits, page);
  const partnerPage = paginate(report.partners, page);
  const periodPage = paginate(report.periods, page);
  const campaignPage = paginate(report.campaigns, page);
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
    const rows = report.filtered.map((usage) => [
      usage.id,
      formatDate(usage.data_solicitacao, true),
      colaboradorNome(data, usage.colaborador_id),
      beneficioDaUtilizacao(data, usage)?.nome ?? "Não encontrado",
      conveniadoDaUtilizacao(data, usage)?.nome_fantasia ?? "Não encontrado",
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