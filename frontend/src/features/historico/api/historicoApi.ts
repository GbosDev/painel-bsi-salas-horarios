import { requisitar } from '../../../shared/api/cliente';
import type { RegistroDeAuditoria } from '../../../shared/api/tipos';

export interface FiltroDeHistorico {
  curso?: string;
  tipo?: string;
  periodo?: string;
  q?: string;
  limite?: number;
}

export const historico = {
  listar: (f: FiltroDeHistorico) => {
    const p = new URLSearchParams();
    if (f.curso) p.set('curso', f.curso);
    if (f.tipo) p.set('tipo', f.tipo);
    if (f.periodo) p.set('periodo', f.periodo);
    if (f.q) p.set('q', f.q);
    if (f.limite) p.set('limite', String(f.limite));
    const qs = p.toString();
    return requisitar<RegistroDeAuditoria[]>('GET', `/api/v1/auditoria${qs ? `?${qs}` : ''}`);
  },
};
