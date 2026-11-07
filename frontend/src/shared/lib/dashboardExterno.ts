/**
 * Dashboards externos aceitos para INCORPORAR (iframe) na aba "Painel". Outros endereços https viram só link.
 * Mantenha em sincronia com `frame-src` da Content-Security-Policy em frontend/nginx/default.conf.template.
 */
export const HOSTS_INCORPORAVEIS = ['lookerstudio.google.com', 'datastudio.google.com', 'docs.google.com'] as const;

export interface DashboardExterno {
  /** Endereço para abrir em nova aba. */
  link: string;
  /** Endereço para o iframe, ou null quando o serviço/endereço não permite incorporação. */
  incorporacao: string | null;
}

/**
 * Interpreta o link configurado. Looker Studio: ".../reporting/<id>/page/<p>" vira ".../embed/reporting/<id>/page/<p>".
 * Google Sheets/Docs: incorpora apenas links publicados ("Publicar na Web": /pubhtml, /pub ou ?embedded=true).
 * Só aceita https; qualquer outra coisa é ignorada (null).
 */
export function interpretarDashboard(bruto: string | null | undefined): DashboardExterno | null {
  if (!bruto) return null;
  let url: URL;
  try {
    url = new URL(bruto.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const link = url.toString();
  const host = url.hostname.toLowerCase();
  if (!(HOSTS_INCORPORAVEIS as readonly string[]).includes(host)) return { link, incorporacao: null };

  if (host === 'docs.google.com') {
    const publicado = /\/(pubhtml|pub)$/.test(url.pathname) || url.searchParams.get('embedded') === 'true';
    return { link, incorporacao: publicado ? link : null };
  }
  const embed = new URL(link);
  if (embed.pathname.startsWith('/reporting/')) embed.pathname = `/embed${embed.pathname}`;
  else if (!embed.pathname.startsWith('/embed/')) return { link, incorporacao: null };
  return { link, incorporacao: embed.toString() };
}
