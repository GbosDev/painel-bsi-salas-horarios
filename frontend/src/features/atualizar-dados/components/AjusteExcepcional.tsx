import { useEffect, useRef, useState } from 'react';
import { useToasts } from '../../../shared/ui/Toasts';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { CatalogoDeSalas } from './ajuste/CatalogoDeSalas';
import { PainelDeTurmas } from './ajuste/PainelDeTurmas';

type Aba = 'turmas' | 'salas';

/** Janela de ajuste excepcional: abas "Turmas" (lista | editor) e "Catálogo de salas". */
export function AjusteExcepcional({ aoFechar }: { aoFechar: () => void }) {
  const { painel } = usePainelDoCurso();
  const { avisar } = useToasts();
  const [aba, setAba] = useState<Aba>('turmas');
  const [avisos, setAvisos] = useState<string[]>([]);
  const botaoFechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botaoFechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'turmas', rotulo: 'Turmas' },
    { id: 'salas', rotulo: 'Catálogo de salas' },
  ];

  return (
    <div
      className="cp-overlay exmod-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className="exmod-card" role="dialog" aria-modal="true" aria-label="Ajuste excepcional">
        <div className="exmod-head">
          <div>
            <h3>Ajuste excepcional</h3>
            <div className="exmod-sub">{painel.curso.nome}</div>
          </div>
          <button
            ref={botaoFechar}
            type="button"
            className="cp-close exmod-close"
            aria-label="Fechar"
            onClick={aoFechar}
          >
            Fechar ×
          </button>
        </div>
        <div className="exmod-body">
          <div className="exception-banner">
            <div className="exception-banner-title">⚠ Uso excepcional</div>
            <div>
              Correções pontuais e urgentes. Para o semestre inteiro, use a importação por planilha. Todo ajuste exige
              um motivo e fica registrado no histórico.
            </div>
          </div>
          <div className="exmod-tabs" role="tablist" aria-label="Seções do ajuste excepcional">
            {abas.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                id={`aba-${a.id}`}
                aria-controls={`painel-${a.id}`}
                className="exmod-tab"
                aria-selected={aba === a.id}
                onClick={() => setAba(a.id)}
              >
                {a.rotulo}
              </button>
            ))}
          </div>
          {avisos.length > 0 && (
            <div className="plan-error" role="status">
              <div className="plan-error-title">Atenção</div>
              <div className="plan-error-list">
                {avisos.map((a) => (
                  <div className="plan-error-item" key={a}>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="exmod-panel" role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
            {aba === 'turmas' ? (
              <PainelDeTurmas
                aoConcluir={(mensagem, novos) => {
                  setAvisos(novos);
                  avisar(mensagem);
                }}
              />
            ) : (
              <CatalogoDeSalas />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
