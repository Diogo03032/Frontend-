import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Badge, DetailList, PageHeader } from "../components/ui";
import { useMeuPerfilVM } from "../viewmodels/useMeuPerfilVM";

export default function MeuPerfil() {
  const { account, profile, role, name, avatar, createdAt } = useMeuPerfilVM();

  return <>
    <PageHeader
      title="Meu perfil"
      description="Consulte os dados da sua conta no portal da Fundação."
      actions={<Link to="/" className="btn btn-secondary"><ArrowLeft size={16} aria-hidden="true" />Voltar ao dashboard</Link>}
    />
    <div className="profile-layout">
      <section className="panel profile-summary" aria-labelledby="profile-name">
        <span className="profile-avatar" aria-hidden="true">{avatar}</span>
        <h2 id="profile-name">{name}</h2>
        <p className="profile-role"><ShieldCheck size={16} aria-hidden="true" />{role}</p>
        <Badge status={account.status} />
        <p className="profile-email"><Mail size={16} aria-hidden="true" />{account.email}</p>
      </section>
      <section className="panel profile-details" aria-labelledby="profile-data-title">
        <div className="panel-header"><h2 id="profile-data-title"><UserRound size={19} aria-hidden="true" />Dados da conta</h2></div>
        <div className="profile-details-body">
          <DetailList items={[
            { label: "Nome completo", value: name },
            { label: "E-mail", value: account.email },
            { label: "Perfil de acesso", value: role },
            { label: "Status da conta", value: <Badge status={account.status} /> },
            { label: "Organização", value: "Fundação Cristiano Varella" },
            { label: "Conta criada em", value: createdAt },
          ]} />
          {profile?.descricao && <div className="profile-description"><h3>Sobre o perfil de acesso</h3><p>{profile.descricao}</p></div>}
        </div>
      </section>
    </div>
  </>;
}
