import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react';

/**
 * Tabela que, em telas estreitas, vira lista de cartões (sem rolagem lateral). Copia o texto de cada
 * cabeçalho para o atributo data-rotulo/data-label das células; o CSS (.stack-m) faz o resto.
 */
export function TabelaEmpilhavel({ className, children, ...resto }: ComponentPropsWithoutRef<'table'>) {
  const ref = useRef<HTMLTableElement>(null);
  useLayoutEffect(() => {
    const tabela = ref.current;
    if (!tabela) return;
    const titulos = Array.from(tabela.querySelectorAll('thead th')).map((th) =>
      (th.textContent ?? '').replace(/[↕]/g, '').trim(),
    );
    tabela.querySelectorAll('tbody tr').forEach((tr) => {
      Array.from(tr.children).forEach((td, i) => {
        const titulo = titulos[i];
        if (!td.hasAttribute('colspan') && titulo) td.setAttribute('data-label', titulo);
      });
    });
  });
  return (
    <table ref={ref} className={`${className ?? ''} stack-m`.trim()} {...resto}>
      {children}
    </table>
  );
}
