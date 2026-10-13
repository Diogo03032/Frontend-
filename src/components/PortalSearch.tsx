import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { usePortal } from "../viewmodels/PortalContext";
import { colaboradorNome } from "../models/selectors";
export default function PortalSearch() {
  const { data } = usePortal();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const records = [
    ...data.colaboradores.map(item => ({name:colaboradorNome(data,item.id),type:"Colaborador",path:"/colaboradores"})),
    ...data.beneficios.map(item => ({name:item.nome,type:"Benefício",path:"/beneficios"})),
    ...data.conveniados.map(item => ({name:item.nome_fantasia,type:"Conveniado",path:"/conveniados"})),
    ...data.campanhas.map(item => ({name:item.nome,type:"Campanha / evento",path:"/campanhas"})),
  ];
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const matches = term ? records.filter(item => item.name.toLocaleLowerCase("pt-BR").includes(term)).slice(0,8) : [];
  return <div className="portal-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <Search size={19} /><input aria-label="Buscar no portal" placeholder="Buscar por colaborador, benefício, conveniado…" value={query} onChange={event => {setQuery(event.target.value);setOpen(true);}} onFocus={() => setOpen(true)} onKeyDown={event => {if(event.key === "Escape") setOpen(false);}} />
    {query && <button className="icon-button" aria-label="Limpar busca do portal" onClick={() => {setQuery("");setOpen(false);}}><X size={16}/></button>}
    {open && term && <div className="portal-search-results" aria-label="Resultados da busca">
      {matches.length ? matches.map((item,index) => <Link key={index} to={`${item.path}?buscar=${encodeURIComponent(item.name)}`} onClick={() => {setOpen(false);setQuery("");}}><span>{item.name}</span><small>{item.type}</small></Link>) : <p>Nenhum registro encontrado.</p>}
    </div>}
  </div>;
}
