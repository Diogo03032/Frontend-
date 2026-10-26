import { useState } from "react";
import { buildReport } from "../models/reportSelectors";
import { withinPeriod } from "../models/selectors";
import { useAuth } from "./AuthContext";
import { usePortal } from "./PortalContext";

export function useDashboardVM() {
  const { data } = usePortal();
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const usages = data.utilizacoes.filter((u) => withinPeriod(u.data_solicitacao, days));
  const approved = usages.filter((u) => u.status === "APROVADA");
  const today = new Date().toISOString().slice(0, 10);
  const first = [...usages].map((item) => item.data_solicitacao.slice(0, 10)).sort()[0] || today;
  const report = buildReport({ ...data, utilizacoes: usages }, first, today);
  const byBenefit = report.benefits.map((item) => ({ name: item.nome, count: item.count }));
  const least = [...byBenefit].sort((a, b) => a.count - b.count).slice(0, 3);
  const colors = ["#283772", "#3b4b86", "#4f6098", "#6575ae", "#8391c0", "#a7b1d2"];
  let offset = 0;
  const stops = report.categories.map((item, index) => {
    const start = offset;
    offset += approved.length ? item.count / approved.length * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });
  const donut = stops.length ? `conic-gradient(${stops.join(",")})` : "#e8f1f8";
  const maximum = Math.max(1, ...byBenefit.map((item) => item.count));
  const latest = [...usages].sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao)).slice(0, 5);
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - i));
    const count = approved.filter((u) => {
      const usageDate = new Date(u.data_solicitacao);
      return usageDate.getMonth() === date.getMonth() && usageDate.getFullYear() === date.getFullYear();
    }).length;
    return { label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), count };
  });
  const maxMonth = Math.max(1, ...months.map((month) => month.count));
  const chartPoints = months.map((month, i) => `${40 + i * 86},${175 - (month.count / maxMonth) * 130}`).join(" ");
  return { data, user, days, setDays, approved, report, byBenefit, least, colors, donut, maximum, latest, months, maxMonth, chartPoints };
}
