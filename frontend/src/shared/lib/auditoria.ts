export const ROTULO_DO_TIPO: Record<string, string> = {
  csv_criada: 'CSV · turma criada',
  csv_atualizada: 'CSV · turma atualizada',
  exceptional_edit: 'Excepcional · edição',
  exceptional_create: 'Excepcional · criação',
  exceptional_delete: 'Excepcional · exclusão',
  sala_add: 'Catálogo · sala adicionada',
  sala_remove: 'Catálogo · sala removida',
};

export const CLASSE_DO_TIPO: Record<string, 'ok' | 'warn' | 'erro'> = {
  csv_criada: 'ok',
  csv_atualizada: 'ok',
  exceptional_edit: 'warn',
  exceptional_create: 'warn',
  exceptional_delete: 'erro',
  sala_add: 'ok',
  sala_remove: 'erro',
};

function texto(v: unknown): string {
  if (v === null || v === undefined) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

/** Resume "o que mudou": campo: "antes" → "depois" (mesmo formato do painel original). */
export function resumoDaMudanca(antes: Record<string, unknown> | null, depois: Record<string, unknown> | null): string {
  const a = antes ?? {};
  const d = depois ?? {};
  const chaves = [...new Set([...Object.keys(a), ...Object.keys(d)])];
  if (!chaves.length) return '—';
  const partes: string[] = [];
  for (const k of chaves) {
    const temA = a[k] !== undefined;
    const temD = d[k] !== undefined;
    if (temA && temD && texto(a[k]) !== texto(d[k])) partes.push(`${k}: "${texto(a[k])}" → "${texto(d[k])}"`);
    else if (temD) partes.push(`${k}: ${texto(d[k])}`);
    else if (temA) partes.push(`${k} (removido): ${texto(a[k])}`);
  }
  return partes.join(' · ') || '—';
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
