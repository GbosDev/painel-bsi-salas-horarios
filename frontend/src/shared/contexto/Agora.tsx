import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { agoraDe, type Agora } from '../lib/horarios';

const Contexto = createContext<Agora>({ dia: 7, minutos: 0 });

/** Relógio do painel: atualiza a cada 30 s. Em testes, `fixo` congela o horário. */
export function AgoraProvider({ children, fixo }: { children: ReactNode; fixo?: Date }) {
  const [relogio, setRelogio] = useState<Date>(() => new Date());
  useEffect(() => {
    if (fixo) return;
    const id = window.setInterval(() => setRelogio(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [fixo]);
  const agora = useMemo(() => agoraDe(fixo ?? relogio), [fixo, relogio]);
  return <Contexto.Provider value={agora}>{children}</Contexto.Provider>;
}

export function useAgora(): Agora {
  return useContext(Contexto);
}
