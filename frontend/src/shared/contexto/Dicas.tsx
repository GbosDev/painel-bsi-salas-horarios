import { createContext, useCallback, useContext, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

interface Estado {
  conteudo: ReactNode;
  estilo: CSSProperties;
  visivel: boolean;
}

interface ValorDeDicas {
  mostrar: (alvo: HTMLElement, conteudo: ReactNode) => void;
  esconder: () => void;
}

const Contexto = createContext<ValorDeDicas>({ mostrar: () => undefined, esconder: () => undefined });

/** Tooltip único (id="tooltip") reaproveitado por todas as siglas e blocos da grade. */
export function DicasProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ conteudo: null, estilo: {}, visivel: false });

  const mostrar = useCallback((alvo: HTMLElement, conteudo: ReactNode) => {
    const r = alvo.getBoundingClientRect();
    const largura = 260;
    const esquerda = Math.min(Math.max(8, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 8);
    setEstado({
      conteudo,
      visivel: true,
      estilo: { left: `${esquerda}px`, top: `${Math.max(8, r.top - 10)}px`, transform: 'translateY(-100%)' },
    });
  }, []);

  const esconder = useCallback(() => setEstado((e) => ({ ...e, visivel: false })), []);
  const valor = useMemo(() => ({ mostrar, esconder }), [mostrar, esconder]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div id="tooltip" className={estado.visivel ? 'show' : ''} style={estado.estilo} role="tooltip">
        {estado.conteudo}
      </div>
    </Contexto.Provider>
  );
}

export function useDicas(): ValorDeDicas {
  return useContext(Contexto);
}
