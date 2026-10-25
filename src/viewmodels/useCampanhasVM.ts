import { useMemo, useState, type FormEvent } from "react";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import { colaboradorNome, formatMoney, statusLabel } from "../models/selectors";

export type PortalData = ReturnType<typeof usePortal>["data"];
export type Campanha = PortalData["campanhas"][number];
export type Item = PortalData["itensCampanha"][number];

export const TIPOS: Record<string, string> = {
  CAMPANHA: "Campanha",
  EVENTO_INTERNO: "Evento interno",
  EVENTO_PATROCINADO: "Evento patrocinado",
  VOUCHER: "Voucher",
  CORTESIA: "Cortesia",
};

const EMPTY = {
  nome: "",
  tipo: "CAMPANHA",
  descricao: "",
  data_inicio: "",
  data_fim: "",
  criterio_elegibilidade: "",
  patrocinador: "",
  status: "PLANEJADA",
};

const EMPTY_ITEM = {
  nome: "",
  descricao: "",
  tipo_beneficio: "PERCENTUAL",
  valor: "",
  quantidade_maxima_utilizacoes: "",
  status: "ATIVO",
};

const PAGE_SIZE = 6;

export function useCampanhasVM() {
  const { data, save } = usePortal();
  const { notify } = useToast();

  // ── Filtros ──
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("buscar") ?? "",
  );
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [campaignPage, setCampaignPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  // ── Modais ──
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Campanha | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [itemEditing, setItemEditing] = useState<Item | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ ...EMPTY_ITEM });
  const [linkItem, setLinkItem] = useState<Item | null>(null);
  const [partnerId, setPartnerId] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Campanha | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Dados derivados ──
  const selected = data.campanhas.find((item) => item.id === selectedId);
  const periodoInvalido = !!inicio && !!fim && fim < inicio;

  const rows = useMemo(
    () =>
      data.campanhas.filter(
        (item) =>
          !periodoInvalido &&
          `${item.nome} ${item.descricao ?? ""} ${item.patrocinador ?? ""}`
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")) &&
          (!tipo || item.tipo === tipo) &&
          (!status || item.status === status) &&
          (!inicio || item.data_fim.slice(0, 10) >= inicio) &&
          (!fim || item.data_inicio.slice(0, 10) <= fim),
      ),
    [data.campanhas, search, tipo, status, inicio, fim, periodoInvalido],
  );

  const campaigns = rows
    .filter((item) => !item.tipo.startsWith("EVENTO"))
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));
  const events = rows
    .filter((item) => item.tipo.startsWith("EVENTO"))
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  const paginate = (items: Campanha[], page: number) => {
    const current = Math.min(
      page,
      Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
    );
    return {
      current,
      rows: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    };
  };

  const campaignList = paginate(campaigns, campaignPage);
  const eventList = paginate(events, eventPage);

  const campanhaItems = data.itensCampanha.filter(
    (item) => item.campanha_id === selectedId,
  );

  const usosCampanha = data.utilizacoes.filter(
    (uso) =>
      uso.status === "APROVADA" &&
      data.ofertasCampanha.some(
        (oferta) =>
          oferta.id === uso.beneficio_campanha_conveniado_id &&
          data.itensCampanha.some(
            (item) =>
              item.id === oferta.beneficio_campanha_id &&
              item.campanha_id === selectedId,
          ),
      ),
  );

  const participantes = new Set(
    data.utilizacoes
      .filter(
        (uso) =>
          uso.status === "APROVADA" && uso.beneficio_campanha_conveniado_id,
      )
      .map((uso) => uso.colaborador_id),
  ).size;

  const today = new Date().toLocaleDateString("sv-SE");

  const filter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCampaignPage(1);
    setEventPage(1);
  };

  // ── Ações ──
  function abrirForm(item?: Campanha) {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            nome: item.nome,
            tipo: item.tipo,
            descricao: item.descricao ?? "",
            data_inicio: item.data_inicio.slice(0, 10),
            data_fim: item.data_fim.slice(0, 10),
            criterio_elegibilidade: item.criterio_elegibilidade ?? "",
            patrocinador: item.patrocinador ?? "",
            status: item.status,
          }
        : { ...EMPTY },
    );
    setShowForm(true);
  }

  function abrirItem(item?: Item) {
    setItemEditing(item ?? null);
    setItemForm(
      item
        ? {
            nome: item.nome,
            descricao: item.descricao ?? "",
            tipo_beneficio: item.tipo_beneficio,
            valor: String(item.valor),
            quantidade_maxima_utilizacoes:
              item.quantidade_maxima_utilizacoes == null
                ? ""
                : String(item.quantidade_maxima_utilizacoes),
            status: item.status,
          }
        : { ...EMPTY_ITEM },
    );
    setShowItemForm(true);
  }

  async function execute(
    action: () => Promise<unknown>,
    message: string,
    after?: () => void,
  ) {
    if (saving) return;
    setSaving(true);
    try {
      await action();
      notify(message, "success");
      after?.();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar. Tente novamente.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitCampanha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.data_fim < form.data_inicio) {
      notify("A data final deve ser igual ou posterior à inicial.", "error");
      return;
    }
    if (!form.nome.trim()) {
      notify("Informe o nome da campanha ou evento.", "error");
      return;
    }
    await execute(
      () =>
        save("campanhas", editing?.id, {
          ...form,
          tipo: form.tipo as Campanha["tipo"],
          status: form.status as Campanha["status"],
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          criterio_elegibilidade: form.criterio_elegibilidade.trim() || null,
          patrocinador: form.patrocinador.trim() || null,
        }),
      editing
        ? "Campanha ou evento atualizado."
        : "Campanha ou evento cadastrado.",
      () => setShowForm(false),
    );
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !itemForm.nome.trim()) return;
    const valor = Number(itemForm.valor);
    if (
      valor <= 0 ||
      (itemForm.tipo_beneficio === "PERCENTUAL" && valor > 100)
    ) {
      notify(
        "Informe um valor válido. Percentuais devem ficar entre 0 e 100.",
        "error",
      );
      return;
    }
    await execute(
      () =>
        save("itensCampanha", itemEditing?.id, {
          ...itemForm,
          tipo_beneficio: itemForm.tipo_beneficio as Item["tipo_beneficio"],
          status: itemForm.status as Item["status"],
          nome: itemForm.nome.trim(),
          campanha_id: selected.id,
          descricao: itemForm.descricao.trim() || null,
          valor,
          quantidade_maxima_utilizacoes: itemForm.quantidade_maxima_utilizacoes
            ? Number(itemForm.quantidade_maxima_utilizacoes)
            : null,
        }),
      itemEditing ? "Item atualizado." : "Item adicionado à campanha.",
      () => setShowItemForm(false),
    );
  }

  async function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linkItem || !partnerId) return;
    const existing = data.ofertasCampanha.find(
      (item) =>
        item.beneficio_campanha_id === linkItem.id &&
        item.conveniado_id === Number(partnerId),
    );
    await execute(
      () =>
        save("ofertasCampanha", existing?.id, {
          beneficio_campanha_id: linkItem.id,
          conveniado_id: Number(partnerId),
          status: "ATIVO",
        }),
      "Conveniado vinculado ao item.",
      () => {
        setLinkItem(null);
        setPartnerId("");
      },
    );
  }

  return {
    // contexto
    data,
    save,
    PAGE_SIZE,
    TIPOS,

    // filtros
    search,
    setSearch,
    tipo,
    setTipo,
    status,
    setStatus,
    inicio,
    setInicio,
    fim,
    setFim,
    campaignPage,
    setCampaignPage,
    eventPage,
    setEventPage,
    periodoInvalido,
    filter,

    // dados derivados
    rows,
    campaigns,
    events,
    campaignList,
    eventList,
    selected,
    selectedId,
    setSelectedId,
    campanhaItems,
    usosCampanha,
    participantes,
    today,

    // formulário campanha
    editing,
    showForm,
    setShowForm,
    form,
    setForm,
    abrirForm,
    submitCampanha,

    // formulário item
    itemEditing,
    showItemForm,
    setShowItemForm,
    itemForm,
    setItemForm,
    abrirItem,
    submitItem,

    // vínculo conveniado
    linkItem,
    setLinkItem,
    partnerId,
    setPartnerId,
    submitLink,

    // cancelamento
    cancelTarget,
    setCancelTarget,

    // loading
    saving,
    execute,

    // helpers re-exportados para o JSX
    statusLabel,
    formatMoney,
    colaboradorNome,
  };
}
