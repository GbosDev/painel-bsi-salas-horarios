import type { ReactNode } from 'react';

/** Carregando: esqueleto com anúncio educado para leitores de tela. */
export function Carregando({ rotulo = 'Carregando…', linhas = 4 }: { rotulo?: string; linhas?: number }) {
  return (
    <div className="skeleton" role="status" aria-live="polite" aria-label={rotulo}>
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} />
      ))}
      <span className="sr-only">{rotulo}</span>
    </div>
  );
}

/** Erro: mensagem clara + ação de tentar de novo. */
export function ErroComTentativa({
  titulo = 'Não foi possível carregar',
  mensagem,
  aoTentar,
}: {
  titulo?: string;
  mensagem: string;
  aoTentar?: () => void;
}) {
  return (
    <div className="estado estado-erro" role="alert">
      <h3>{titulo}</h3>
      <p>{mensagem}</p>
      {aoTentar && (
        <button type="button" className="ad-btn" onClick={aoTentar}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Vazio: explica o que aconteceu e orienta o próximo passo. */
export function Vazio({ titulo, orientacao, acao }: { titulo: string; orientacao?: string; acao?: ReactNode }) {
  return (
    <div className="estado estado-vazio">
      <h3>{titulo}</h3>
      {orientacao && <p>{orientacao}</p>}
      {acao}
    </div>
  );
}
