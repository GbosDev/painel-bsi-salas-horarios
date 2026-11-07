import { useConfiguracao } from '../../../shared/config/configuracao';
import { interpretarDashboard } from '../../../shared/lib/dashboardExterno';
import { Carregando, Vazio } from '../../../shared/ui/Estados';

/**
 * Aba "Painel": exibe um dashboard externo (ex.: Google Looker Studio) configurado por PAINEL_DASHBOARD_URL.
 * Sem configuração, mostra um estado vazio explicando como ligar.
 */
export function VisaoPainel() {
  const config = useConfiguracao();
  const dashboard = interpretarDashboard(config.data?.painelDashboardUrl);

  return (
    <section className="view active" id="view-painel">
      <div className="section-head">
        <div>
          <h2>Painel</h2>
          <div className="desc">Indicadores da oferta em um dashboard externo.</div>
        </div>
        {dashboard && (
          <a className="csv-template-btn dash-abrir" href={dashboard.link} target="_blank" rel="noopener noreferrer">
            Abrir dashboard em nova aba ↗
          </a>
        )}
      </div>

      {config.isPending && <Carregando rotulo="Carregando painel…" linhas={5} />}

      {!config.isPending && !dashboard && (
        <Vazio
          titulo="Nenhum dashboard configurado"
          orientacao="Defina PAINEL_DASHBOARD_URL com o link do relatório (ex.: Google Looker Studio) no .env e reinicie o front. Veja o README, seção Painel."
        />
      )}

      {dashboard?.incorporacao && (
        <div className="dash-moldura">
          <iframe
            title="Dashboard externo"
            src={dashboard.incorporacao}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"
            allowFullScreen
          />
        </div>
      )}

      {dashboard && !dashboard.incorporacao && (
        <Vazio
          titulo="Este dashboard abre em uma nova aba"
          orientacao="O endereço configurado não permite exibição dentro do site. Use o botão “Abrir dashboard em nova aba”."
        />
      )}
    </section>
  );
}
