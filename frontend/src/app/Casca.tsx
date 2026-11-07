import { lazy, Suspense, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Carregando, ErroComTentativa, Vazio } from '../shared/ui/Estados';
import { usePainel } from '../features/cursos/hooks/usePainel';
import { abasDoPerfil, Cabecalho } from './layout/Cabecalho';
import { Gaveta } from '../features/turmas/components/Gaveta';
import { Hero } from './layout/Hero';
import { VisaoDisciplinas } from '../features/disciplinas/components/VisaoDisciplinas';
import { VisaoGrade } from '../features/grade/components/VisaoGrade';
import { VisaoSalas } from '../features/salas/components/VisaoSalas';
import { useCursos } from '../features/cursos/hooks/useCursos';
import { PainelDoCursoProvider, usePainelDoCurso } from '../features/cursos/hooks/PainelDoCurso';
import { useSessao } from '../features/autenticacao/hooks/Sessao';

// Telas menos usadas viram chunks separados (code splitting).
const VisaoAtualizarDados = lazy(() =>
  import('../features/atualizar-dados/components/VisaoAtualizarDados').then((m) => ({
    default: m.VisaoAtualizarDados,
  })),
);
const VisaoHistorico = lazy(() =>
  import('../features/historico/components/VisaoHistorico').then((m) => ({ default: m.VisaoHistorico })),
);
const VisaoPainel = lazy(() =>
  import('../features/painel/components/VisaoPainel').then((m) => ({ default: m.VisaoPainel })),
);
const VisaoMeuPlano = lazy(() =>
  import('../features/plano/components/VisaoMeuPlano').then((m) => ({ default: m.VisaoMeuPlano })),
);

/** Redireciona "/" para o primeiro curso da lista. */
export function Inicio() {
  const { cursos, carregando, erro, tentarDeNovo } = useCursos();
  if (carregando) return <Carregando rotulo="Carregando cursos…" />;
  const primeiro = cursos[0];
  if (erro)
    return (
      <div className="wrap">
        <ErroComTentativa mensagem={erro} aoTentar={tentarDeNovo} />
      </div>
    );
  if (!primeiro)
    return (
      <div className="wrap">
        <Vazio titulo="Nenhum curso cadastrado" orientacao="Peça à coordenação para cadastrar os cursos do semestre." />
      </div>
    );
  return <Navigate to={`/curso/${primeiro.codigo}/predio`} replace />;
}

export function Casca() {
  const { codigo = '', aba = 'predio' } = useParams();
  const { usuario } = useSessao();
  const { consulta, recarregar } = usePainel(codigo);
  const painel = consulta.data;

  // atributos que o CSS usa para tema e para esconder o hero nas abas administrativas
  useEffect(() => {
    document.body.setAttribute('data-tab', aba);
    // data-curso: o padrão gráfico do hero é escolhido por curso (telas.css)
    if (painel) document.body.setAttribute('data-curso', painel.curso.codigo);
    const tema = painel?.curso.tema ?? '';
    if (tema && tema !== 'padrao') document.body.setAttribute('data-theme', tema);
    else document.body.removeAttribute('data-theme');
    return () => {
      document.body.removeAttribute('data-tab');
      document.body.removeAttribute('data-theme');
      document.body.removeAttribute('data-curso');
    };
  }, [aba, painel]);

  useEffect(() => {
    document.title = painel ? `Painel de Salas UNIRIO · ${painel.curso.nome}` : 'Painel de Salas UNIRIO';
  }, [painel]);

  if (!usuario) return null;
  const abasValidas = abasDoPerfil(usuario.perfil).map((a) => a.id);
  if (!abasValidas.includes(aba)) return <Navigate to={`/curso/${codigo}/predio`} replace />;

  if (!painel) {
    return (
      <div id="app">
        <CabecalhoEnxuto codigo={codigo} aba={aba} />
        <main className="wrap" id="conteudo">
          {consulta.isPending && <Carregando rotulo="Carregando painel…" linhas={6} />}
          {consulta.isError && (
            <ErroComTentativa
              titulo="Não foi possível abrir este curso"
              mensagem={consulta.error.message}
              aoTentar={() => void consulta.refetch()}
            />
          )}
          {consulta.isError && (
            <p style={{ marginTop: 12, textAlign: 'center' }}>
              <Link to="/">Voltar ao início</Link>
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <PainelDoCursoProvider painel={painel} recarregar={recarregar}>
      <Conteudo codigo={codigo} aba={aba} />
    </PainelDoCursoProvider>
  );
}

function CabecalhoEnxuto({ codigo, aba }: { codigo: string; aba: string }) {
  const navegar = useNavigate();
  return (
    <Cabecalho
      codigoAtual={codigo}
      aba={aba}
      mostrarGrade={false}
      grade="2023"
      aoMudarGrade={() => undefined}
      aoMudarAba={(id) => navegar(`/curso/${codigo}/${id}`)}
    />
  );
}

function Conteudo({ codigo, aba }: { codigo: string; aba: string }) {
  const { painel, grade, definirGrade, abrirGaveta } = usePainelDoCurso();
  const navegar = useNavigate();
  const { curso } = painel;
  return (
    <div id="app">
      <Cabecalho
        codigoAtual={codigo}
        aba={aba}
        mostrarGrade={curso.alternaMatrizes}
        grade={grade}
        aoMudarGrade={definirGrade}
        aoMudarAba={(id) => navegar(`/curso/${codigo}/${id}`)}
      />
      <Hero
        curso={curso}
        periodoLetivo={painel.periodoLetivo}
        turmas={painel.turmas}
        grade={grade}
        aoEscolherNaBusca={(t) => abrirGaveta(t, 'busca')}
      />
      <main className="wrap" id="conteudo">
        {curso.situacao === 'escopo' && (
          <div className="scope-banner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              <b>Versão de escopo — {curso.nome}.</b> {curso.descricao}
            </span>
          </div>
        )}
        <Suspense fallback={<Carregando rotulo="Carregando…" linhas={5} />}>
          {aba === 'predio' && <VisaoSalas />}
          {aba === 'grade' && <VisaoGrade />}
          {aba === 'disciplinas' && <VisaoDisciplinas />}
          {aba === 'plano' && <VisaoMeuPlano />}
          {aba === 'painel' && <VisaoPainel />}
          {aba === 'csv' && <VisaoAtualizarDados />}
          {aba === 'historico' && <VisaoHistorico />}
        </Suspense>
      </main>
      <footer>
        <div className="wrap foot-row">
          <div className="foot-legend">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--teal)' }} />
              Grade 2023
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--plum)' }} />
              Grade 2008
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--rose)' }} />
              Em aula agora
            </div>
          </div>
        </div>
      </footer>
      <Gaveta />
    </div>
  );
}
