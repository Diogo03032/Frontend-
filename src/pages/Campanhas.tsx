import {
  CalendarDays,
  CircleX,
  Eye,
  Gift,
  Link2,
  Megaphone,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import {
  colaboradorNome,
  formatDate,
  formatMoney,
  statusLabel,
} from "../models/selectors";
import {
  Badge,
  DetailList,
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchField,
  StatCard,
} from "../components/ui";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  useCampanhasVM,
  TIPOS,
  type Campanha,
  type Item,
} from "../viewmodels/useCampanhasVM";

export default function Campanhas() {
  const {
    data,
    save,
    PAGE_SIZE,
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
    editing,
    showForm,
    setShowForm,
    form,
    setForm,
    abrirForm,
    submitCampanha,
    itemEditing,
    showItemForm,
    setShowItemForm,
    itemForm,
    setItemForm,
    abrirItem,
    submitItem,
    linkItem,
    setLinkItem,
    partnerId,
    setPartnerId,
    submitLink,
    cancelTarget,
    setCancelTarget,
    saving,
    formError,
    setFormError,
    execute,
  } = useCampanhasVM();

  const lists = [
    { title: "Campanhas", one: "campanha", many: "campanhas", icon: <Megaphone size={20} />, items: campaigns, ...campaignList, onChange: setCampaignPage },
    { title: "Eventos", one: "evento", many: "eventos", icon: <CalendarDays size={20} />, items: events, ...eventList, onChange: setEventPage },
  ];

  const initiativeColumns = [
    {key:"name",label:"Título",render:(item:Campanha) => <div><strong className="cell-title">{item.nome}</strong><p className="cell-subtitle">{item.descricao || TIPOS[item.tipo]}</p></div>},
    {key:"period",label:"Período",render:(item:Campanha) => <span>{formatDate(item.data_inicio)} a {formatDate(item.data_fim)}</span>},
    {key:"benefits",label:"Benefícios",render:(item:Campanha) => data.itensCampanha.filter(benefit=>benefit.campanha_id===item.id).length},
    {key:"status",label:"Status",render:(item:Campanha) => <Badge status={item.status}/>},
    {key:"actions",label:"Ações",render:(item:Campanha) => <div className="table-actions"><button className="icon-button" aria-label={`Ver detalhes de ${item.nome}`} onClick={()=>setSelectedId(item.id)}><Eye size={16}/></button><button className="icon-button" aria-label={`Editar ${item.nome}`} onClick={()=>abrirForm(item)}><Pencil size={16}/></button>{!["CANCELADA","ENCERRADA"].includes(item.status) && <button className="icon-button danger" aria-label={`Cancelar ${item.nome}`} onClick={()=>setCancelTarget(item)}><CircleX size={16}/></button>}</div>},
  ];
  return (
    <>
      <PageHeader
        eyebrow="RELACIONAMENTO"
        title="Campanhas e eventos"
        description="Organize iniciativas e benefícios promocionais para os colaboradores."
        actions={
          <button className="btn btn-primary" onClick={() => abrirForm()}>
            <Plus size={18} /> Nova campanha ou evento
          </button>
        }
      />
      <div className="stats-grid campaign-stats">
        <StatCard
          label="Campanhas em andamento"
          value={
            data.campanhas.filter(
              (item) =>
                item.tipo === "CAMPANHA" &&
                item.status === "ATIVA" &&
                item.data_inicio.slice(0, 10) <= today &&
                item.data_fim.slice(0, 10) >= today,
            ).length
          }
          icon={<Megaphone />}
          detail="Ativas e dentro do período de vigência"
        />
        <StatCard
          label="Próximos eventos"
          value={
            data.campanhas.filter(
              (item) =>
                item.tipo.startsWith("EVENTO") &&
                ["ATIVA", "PLANEJADA"].includes(item.status) &&
                item.data_inicio.slice(0, 10) >= today,
            ).length
          }
          icon={<CalendarDays />}
          tone="green"
          detail="Eventos planejados ou ativos"
        />
        <StatCard
          label="Itens promocionais ativos"
          value={
            data.itensCampanha.filter((item) => item.status === "ATIVO").length
          }
          icon={<Gift />}
          tone="purple"
          detail="Itens cadastrados em campanhas e eventos"
        />
        <StatCard
          label="Colaboradores participantes"
          value={participantes}
          icon={<Users />}
          tone="amber"
          detail="Com resgate aprovado de item promocional"
        />
      </div>
      <section className="panel campaign-panel">
        <div className="panel-header">
          <div>
            <h2>Iniciativas da fundação</h2>
            <p className="text-muted">
              Campanhas, eventos, vouchers e cortesias em um só lugar.
            </p>
          </div>
          <span className="result-count">{rows.length} iniciativas</span>
        </div>
        <div className="filters campaign-filter-row">
          <SearchField
            value={search}
            onChange={(value) => filter(setSearch, value)}
            placeholder="Buscar campanha, descrição ou patrocinador"
          />
          <Field label="Tipo">
            <select
              value={tipo}
              onChange={(event) => filter(setTipo, event.target.value)}
            >
              <option value="">Todos os tipos</option>
              {Object.entries(TIPOS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(event) => filter(setStatus, event.target.value)}
            >
              <option value="">Todos os status</option>
              {["PLANEJADA", "ATIVA", "ENCERRADA", "CANCELADA"].map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="filters campaign-filter-dates">
          <Field label="Vigente a partir de">
            <input
              type="date"
              value={inicio}
              onChange={(event) => filter(setInicio, event.target.value)}
            />
          </Field>
          <Field
            label="Vigente até"
            error={
              periodoInvalido
                ? "A data final deve ser posterior à inicial."
                : undefined
            }
          >
            <input
              type="date"
              min={inicio || undefined}
              value={fim}
              onChange={(event) => filter(setFim, event.target.value)}
            />
          </Field>
          <p className="filter-hint">
            O filtro mostra iniciativas cujo período coincide com as datas
            selecionadas.
          </p>
        </div>
        <div className="campaign-overview">
          {lists.filter((list) => list.items.length > 0).map((list) => (
            <section className="panel campaign-list" key={list.title}>
              <div className="panel-header"><h2>{list.icon} {list.title}</h2><span className="campaign-count">{list.items.length} {list.items.length === 1 ? list.one : list.many}</span></div>
              <DataTable rows={list.rows} columns={initiativeColumns} getRowKey={(item) => item.id} />
              <Pagination page={list.current} total={list.items.length} pageSize={PAGE_SIZE} onChange={list.onChange} />
            </section>
          ))}
          {!rows.length && (
            <EmptyState
              title="Nenhuma iniciativa encontrada"
              description="Ajuste os filtros ou cadastre uma campanha ou evento."
            />
          )}
          <section className="panel promotional-table"><div className="panel-header"><h2><Gift size={20}/> Benefícios promocionais</h2></div><DataTable rows={data.itensCampanha.filter(item=>rows.some(campanha=>campanha.id===item.campanha_id))} columns={[
            {key:"name",label:"Benefício",render:item=><strong className="cell-title">{item.nome}</strong>},
            {key:"campaign",label:"Campanha / evento",render:item=>data.campanhas.find(campanha=>campanha.id===item.campanha_id)?.nome},
            {key:"value",label:"Desconto / condição",render:item=>item.tipo_beneficio==="PERCENTUAL" ? `${Number(item.valor)}%` : formatMoney(item.valor)},
            {key:"status",label:"Status",render:item=><Badge status={item.status}/>},
            {key:"actions",label:"Ações",render:item=><button className="icon-button" aria-label={`Gerenciar ${item.nome}`} onClick={()=>setSelectedId(item.campanha_id)}><Eye size={16}/></button>},
          ]} getRowKey={item=>item.id}/></section>
        </div>
      </section>
      {selected && !showForm && !showItemForm && !linkItem && (
        <Modal
          wide
          title={selected.nome}
          onClose={() => setSelectedId(null)}
          description={TIPOS[selected.tipo as keyof typeof TIPOS]}
        >
          <div className="detail-status">
            <Badge status={selected.status} />
          </div>
          <DetailList
            items={[
              {
                label: "Período",
                value: `${formatDate(selected.data_inicio)} a ${formatDate(selected.data_fim)}`,
              },
              {
                label: "Descrição",
                value: selected.descricao || "Não informada",
              },
              {
                label: "Elegibilidade",
                value: selected.criterio_elegibilidade || "Não informada",
              },
              {
                label: "Patrocinador",
                value: selected.patrocinador || "Não informado",
              },
              { label: "Resgates aprovados", value: usosCampanha.length },
              {
                label: "Participantes únicos",
                value: new Set(usosCampanha.map((uso) => uso.colaborador_id))
                  .size,
              },
            ]}
          />
          <div className="panel-header detail-section">
            <div>
              <h3>Itens e conveniados</h3>
              <p className="text-muted">
                Defina as condições e os parceiros que oferecem cada item.
              </p>
            </div>
            <button
              className="btn btn-primary btn-small"
              disabled={
                selected.status === "CANCELADA" ||
                selected.status === "ENCERRADA"
              }
              onClick={() => abrirItem()}
            >
              <Plus size={15} /> Adicionar item
            </button>
          </div>
          {campanhaItems.length ? (
            <div className="item-list">
              {campanhaItems.map((item) => {
                const ofertas = data.ofertasCampanha.filter(
                  (oferta) => oferta.beneficio_campanha_id === item.id,
                );
                return (
                  <article className="campaign-item" key={item.id}>
                    <div className="panel-header">
                      <div>
                        <h4>{item.nome}</h4>
                        <p className="text-muted">
                          {item.tipo_beneficio === "PERCENTUAL"
                            ? `${Number(item.valor)}% de desconto`
                            : `${formatMoney(Number(item.valor))} de benefício`}
                          {item.quantidade_maxima_utilizacoes != null
                            ? ` · Limite de ${item.quantidade_maxima_utilizacoes} utilizações`
                            : " · Sem limite cadastrado"}
                        </p>
                      </div>
                      <div className="table-actions">
                        <Badge status={item.status} />
                        <button
                          className="icon-button"
                          aria-label={`Editar item ${item.nome}`}
                          onClick={() => abrirItem(item)}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>
                    <p>{item.descricao}</p>
                    <div className="linked-partners">
                      {ofertas.map((oferta) => {
                        const parceiro = data.conveniados.find(
                          (p) => p.id === oferta.conveniado_id,
                        );
                        return (
                          <div className="linked-partner" key={oferta.id}>
                            <span>
                              {parceiro?.nome_fantasia ||
                                parceiro?.razao_social ||
                                `Conveniado #${oferta.conveniado_id}`}
                            </span>
                            <Badge status={oferta.status} />
                            <button
                              className="btn btn-secondary btn-small"
                              disabled={
                                saving ||
                                (oferta.status === "INATIVO" &&
                                  (parceiro?.status !== "ATIVO" ||
                                    item.status !== "ATIVO" ||
                                    selected.status === "CANCELADA" ||
                                    selected.status === "ENCERRADA"))
                              }
                              onClick={() =>
                                execute(
                                  () =>
                                    save("ofertasCampanha", oferta.id, {
                                      status:
                                        oferta.status === "ATIVO"
                                          ? "INATIVO"
                                          : "ATIVO",
                                    }),
                                  oferta.status === "ATIVO"
                                    ? "Vínculo inativado. Histórico preservado."
                                    : "Vínculo reativado.",
                                )
                              }
                            >
                              {oferta.status === "ATIVO"
                                ? "Desvincular"
                                : "Reativar"}
                            </button>
                          </div>
                        );
                      })}
                      {!ofertas.length && (
                        <p className="text-muted">
                          Nenhum conveniado vinculado a este item.
                        </p>
                      )}
                    </div>
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={
                        item.status !== "ATIVO" ||
                        selected.status === "CANCELADA" ||
                        selected.status === "ENCERRADA"
                      }
                      onClick={() => {
                        setFormError("");
                        setLinkItem(item);
                        setPartnerId("");
                      }}
                    >
                      <Link2 size={15} /> Vincular conveniado
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Esta iniciativa ainda não tem itens"
              description="Adicione um benefício promocional e vincule os conveniados que o oferecem."
            />
          )}
          {usosCampanha.length > 0 && (
            <p className="text-muted detail-section">
              Último participante registrado:{" "}
              {colaboradorNome(
                data,
                [...usosCampanha].sort((a, b) =>
                  b.data_solicitacao.localeCompare(a.data_solicitacao),
                )[0].colaborador_id,
              )}
              .
            </p>
          )}
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedId(null)}
            >
              Fechar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => abrirForm(selected)}
            >
              <Pencil size={16} /> Editar iniciativa
            </button>
          </div>
        </Modal>
      )}
      {showForm && (
        <Modal
          wide
          title={
            editing ? "Editar campanha ou evento" : "Nova campanha ou evento"
          }
          description="Informe os dados da iniciativa e seu período de vigência."
          onClose={() => {
            if (!saving) setShowForm(false);
          }}
        >
          <form onSubmit={submitCampanha}>
            <div className="form-grid">
              <Field label="Nome" required>
                <input
                  required
                  maxLength={150}
                  value={form.nome}
                  onChange={(event) =>
                    setForm({ ...form, nome: event.target.value })
                  }
                />
              </Field>
              <Field label="Tipo" required>
                <select
                  value={form.tipo}
                  onChange={(event) =>
                    setForm({ ...form, tipo: event.target.value })
                  }
                >
                  {Object.entries(TIPOS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Data de início" required>
                <input
                  required
                  type="date"
                  value={form.data_inicio}
                  onChange={(event) =>
                    setForm({ ...form, data_inicio: event.target.value })
                  }
                />
              </Field>
              <Field label="Data de término" required>
                <input
                  required
                  type="date"
                  min={form.data_inicio || undefined}
                  value={form.data_fim}
                  onChange={(event) =>
                    setForm({ ...form, data_fim: event.target.value })
                  }
                />
              </Field>
              <Field label="Status" required>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  {["PLANEJADA", "ATIVA", "ENCERRADA", "CANCELADA"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Patrocinador">
                <input
                  maxLength={150}
                  value={form.patrocinador}
                  onChange={(event) =>
                    setForm({ ...form, patrocinador: event.target.value })
                  }
                  placeholder="Opcional"
                />
              </Field>
              <div className="full-width">
                <Field label="Descrição">
                  <textarea
                    rows={3}
                    value={form.descricao}
                    onChange={(event) =>
                      setForm({ ...form, descricao: event.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="full-width">
                <Field
                  label="Critérios de elegibilidade"
                  hint="Descreva quem pode participar. A validação de elegibilidade depende da API."
                >
                  <textarea
                    rows={2}
                    value={form.criterio_elegibilidade}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        criterio_elegibilidade: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
            {formError && <p className="full-width form-error" role="alert">{formError}</p>}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Salvando…"
                  : editing
                    ? "Salvar alterações"
                    : "Cadastrar iniciativa"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showItemForm && selected && (
        <Modal
          title={
            itemEditing
              ? "Editar item promocional"
              : "Adicionar item promocional"
          }
          description={selected.nome}
          onClose={() => {
            if (!saving) setShowItemForm(false);
          }}
        >
          <form onSubmit={submitItem}>
            <div className="form-grid">
              <div className="full-width">
                <Field label="Nome do item" required>
                  <input
                    required
                    maxLength={150}
                    value={itemForm.nome}
                    onChange={(event) =>
                      setItemForm({ ...itemForm, nome: event.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Tipo de benefício" required>
                <select
                  value={itemForm.tipo_beneficio}
                  onChange={(event) =>
                    setItemForm({
                      ...itemForm,
                      tipo_beneficio: event.target.value,
                    })
                  }
                >
                  <option value="PERCENTUAL">Percentual (%)</option>
                  <option value="VALOR_FIXO">Valor fixo (R$)</option>
                </select>
              </Field>
              <Field
                label={
                  itemForm.tipo_beneficio === "PERCENTUAL"
                    ? "Percentual"
                    : "Valor (R$)"
                }
                required
              >
                <input
                  type="number"
                  required
                  min="0.01"
                  max={
                    itemForm.tipo_beneficio === "PERCENTUAL" ? 100 : undefined
                  }
                  step="0.01"
                  value={itemForm.valor}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, valor: event.target.value })
                  }
                />
              </Field>
              <Field
                label="Limite de utilizações"
                hint="Vazio para não definir limite."
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemForm.quantidade_maxima_utilizacoes}
                  onChange={(event) =>
                    setItemForm({
                      ...itemForm,
                      quantidade_maxima_utilizacoes: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  value={itemForm.status}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, status: event.target.value })
                  }
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </Field>
              <div className="full-width">
                <Field label="Descrição">
                  <textarea
                    rows={3}
                    value={itemForm.descricao}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        descricao: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
            {formError && <p className="full-width form-error" role="alert">{formError}</p>}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowItemForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Salvando…" : "Salvar item"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {linkItem && (
        <Modal
          title="Vincular conveniado"
          description={`Selecione quem oferece o item “${linkItem.nome}”.`}
          onClose={() => {
            if (!saving) setLinkItem(null);
          }}
        >
          <form onSubmit={submitLink}>
            <Field label="Conveniado ativo" required>
              <select
                required
                value={partnerId}
                onChange={(event) => setPartnerId(event.target.value)}
              >
                <option value="">Selecione um conveniado</option>
                {data.conveniados
                  .filter(
                    (parceiro) =>
                      parceiro.status === "ATIVO" &&
                      !data.ofertasCampanha.some(
                        (oferta) =>
                          oferta.beneficio_campanha_id === linkItem.id &&
                          oferta.conveniado_id === parceiro.id &&
                          oferta.status === "ATIVO",
                      ),
                  )
                  .map((parceiro) => (
                    <option key={parceiro.id} value={parceiro.id}>
                      {parceiro.nome_fantasia || parceiro.razao_social}
                    </option>
                  ))}
              </select>
            </Field>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setLinkItem(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving || !partnerId}
              >
                {saving ? "Vinculando…" : "Vincular conveniado"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancelar campanha ou evento"
          description="O cadastro e o histórico de resgates serão preservados."
          onClose={() => {
            if (!saving) setCancelTarget(null);
          }}
          onConfirm={() =>
            execute(
              () =>
                save("campanhas", cancelTarget.id, { status: "CANCELADA" }),
              "Iniciativa cancelada. Histórico preservado.",
              () => setCancelTarget(null),
            )
          }
          confirming={saving}
          confirmLabel="Confirmar cancelamento"
          confirmingLabel="Cancelando…"
        >
          <p>Confirma o cancelamento de <strong>{cancelTarget.nome}</strong>?</p>
        </ConfirmModal>
      )}
    </>
  );
}
