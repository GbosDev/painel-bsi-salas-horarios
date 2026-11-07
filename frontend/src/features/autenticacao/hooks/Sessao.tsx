import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { definirAoPerderSessao } from '../../../shared/api/cliente';
import { autenticacao } from '../api/autenticacaoApi';
import type { Usuario } from '../../../shared/api/tipos';

interface ValorDaSessao {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<ValorDaSessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    autenticacao
      .eu()
      .then((u) => ativo && setUsuario(u))
      .catch(() => ativo && setUsuario(null))
      .finally(() => ativo && setCarregando(false));
    definirAoPerderSessao(() => setUsuario(null));
    return () => {
      ativo = false;
      definirAoPerderSessao(null);
    };
  }, []);

  const entrar = useCallback(async (login: string, senha: string) => {
    setUsuario(await autenticacao.entrar(login.trim(), senha));
  }, []);

  const sair = useCallback(async () => {
    try {
      await autenticacao.sair();
    } finally {
      setUsuario(null);
    }
  }, []);

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorDaSessao {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSessao fora do SessaoProvider');
  return v;
}
