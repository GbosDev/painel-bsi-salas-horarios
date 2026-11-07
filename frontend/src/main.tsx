import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './shared/estilos/tokens.css';
import './shared/estilos/painel.css';
import './shared/estilos/extras.css';
import './shared/estilos/telas.css';
import './shared/estilos/identidade.css';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Elemento #raiz não encontrado');
createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
