import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessaoProvider, useSessao } from '../features/autenticacao/hooks/Sessao';
import { criarQueryClient } from '../shared/api/queryClient';
import { AgoraProvider } from '../shared/contexto/Agora';
import { DicasProvider } from '../shared/contexto/Dicas';
import { Carregando } from '../shared/ui/Estados';
import { ToastsProvider } from '../shared/ui/Toasts';

// Code splitting por rota: cada tela vira um chunk carregado sob demanda.
const Login = lazy(() => import('../features/autenticacao/components/Login').then((m) => ({ default: m.Login })));
const Casca = lazy(() => import('./Casca').then((m) => ({ default: m.Casca })));
const Inicio = lazy(() => import('./Casca').then((m) => ({ default: m.Inicio })));

function Protegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useSessao();
  if (carregando) return <Carregando rotulo="Verificando sessão…" />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function Rotas() {
  return (
    <Suspense fallback={<Carregando rotulo="Carregando…" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protegida>
              <Inicio />
            </Protegida>
          }
        />
        <Route
          path="/curso/:codigo/:aba?"
          element={
            <Protegida>
              <Casca />
            </Protegida>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  const [cliente] = useState(criarQueryClient);
  return (
    <QueryClientProvider client={cliente}>
      <BrowserRouter>
        <SessaoProvider>
          <AgoraProvider>
            <DicasProvider>
              <ToastsProvider>
                <a className="skip-link" href="#conteudo">
                  Ir para o conteúdo
                </a>
                <Rotas />
              </ToastsProvider>
            </DicasProvider>
          </AgoraProvider>
        </SessaoProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
