import { gpsPolicy } from "@crewops/shared";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  RadioTower,
  Route,
  ShieldCheck,
  Truck,
  Wifi,
} from "lucide-react";

const workOrders = [
  {
    code: "OS-1048",
    city: "São Mateus",
    tech: "Rafael",
    status: "Em deslocamento",
    tone: "yellow",
  },
  { code: "OS-1049", city: "Guriri", tech: "Marta", status: "No local", tone: "green" },
  {
    code: "OS-1050",
    city: "Conceição",
    tech: "Diego",
    status: "Aguardando evidência",
    tone: "blue",
  },
];

const events = [
  "Rafael iniciou deslocamento com GPS registrado",
  "Marta chegou ao local e anexou foto da CTO",
  "Diego sincronizou fila offline em primeiro plano",
  "OS-1046 concluída com assinatura do cliente",
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <span className="brandMark">C</span>
          <span>CrewOps</span>
        </div>
        <nav className="nav">
          <a className="active" href="/operacao">
            <RadioTower size={18} /> Operação
          </a>
          <a href="/mapa">
            <MapPin size={18} /> Mapa
          </a>
          <a href="/ordens">
            <Truck size={18} /> Ordens
          </a>
          <a href="/tecnicos">
            <Wifi size={18} /> Técnicos
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="context">Piloto provedor · matriz e filiais</p>
            <h1>Operação de campo em tempo real operacional</h1>
          </div>
          <button className="primaryButton" type="button">
            <Truck size={18} />
            Nova OS
          </button>
        </header>

        <section className="gpsNotice" aria-label="Política de GPS">
          <ShieldCheck size={20} />
          <div>
            <strong>GPS por evento, não rastreamento contínuo.</strong>
            <p>{gpsPolicy.statement}</p>
          </div>
        </section>

        <section className="metrics" aria-label="Indicadores de hoje">
          <div>
            <span>OS abertas</span>
            <strong>28</strong>
          </div>
          <div>
            <span>Em campo</span>
            <strong>9</strong>
          </div>
          <div>
            <span>Atrasadas</span>
            <strong>3</strong>
          </div>
          <div>
            <span>Concluídas hoje</span>
            <strong>16</strong>
          </div>
        </section>

        <section className="operationGrid">
          <div className="mapPanel">
            <div className="mapHeader">
              <div>
                <p>Mapa operacional</p>
                <h2>Técnicos por último evento registrado</h2>
              </div>
              <span className="liveBadge">ao vivo</span>
            </div>
            <div className="mapCanvas" role="img" aria-label="Mapa ilustrativo de técnicos">
              <span className="road roadA" />
              <span className="road roadB" />
              <span className="pin pinA">
                <Truck size={18} />
              </span>
              <span className="pin pinB">
                <CheckCircle2 size={18} />
              </span>
              <span className="pin pinC">
                <AlertTriangle size={18} />
              </span>
            </div>
          </div>

          <div className="queuePanel">
            <div className="panelTitle">
              <Clock3 size={18} />
              <h2>Fila de despacho</h2>
            </div>
            <div className="orderList">
              {workOrders.map((order) => (
                <article className="orderItem" key={order.code}>
                  <div>
                    <strong>{order.code}</strong>
                    <span>
                      {order.city} · {order.tech}
                    </span>
                  </div>
                  <em data-tone={order.tone}>{order.status}</em>
                </article>
              ))}
            </div>
          </div>

          <div className="eventsPanel">
            <div className="panelTitle">
              <Route size={18} />
              <h2>Eventos recentes</h2>
            </div>
            <ul>
              {events.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
