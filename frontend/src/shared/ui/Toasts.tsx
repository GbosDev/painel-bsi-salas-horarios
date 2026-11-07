import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Tipo = 'ok' | 'erro';
interface Toast {
  id: number;
  tipo: Tipo;
  texto: string;
}
interface ValorDeToasts {
  avisar: (texto: string, tipo?: Tipo) => void;
}

const Contexto = createContext<ValorDeToasts>({ avisar: () => undefined });
let proximo = 1;

/** Feedback imediato e não bloqueante para ações (salvar, criar, excluir). Some sozinho e é anunciado a leitores de tela. */
export function ToastsProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Toast[]>([]);
  const avisar = useCallback((texto: string, tipo: Tipo = 'ok') => {
    const id = proximo++;
    setItens((atual) => [...atual, { id, tipo, texto }]);
    window.setTimeout(() => setItens((atual) => atual.filter((t) => t.id !== id)), tipo === 'erro' ? 8000 : 4500);
  }, []);
  const valor = useMemo(() => ({ avisar }), [avisar]);
  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="toasts" role="region" aria-label="Notificações" aria-live="polite">
        {itens.map((t) => (
          <div key={t.id} className="toast" data-tipo={t.tipo} role={t.tipo === 'erro' ? 'alert' : 'status'}>
            {t.texto}
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useToasts(): ValorDeToasts {
  return useContext(Contexto);
}
