package br.unirio.painel.oferta.aplicacao;

import br.unirio.painel.oferta.dominio.Turma;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de saída: turmas do período letivo vigente. */
public interface RepositorioDeTurmas {

    String periodoVigente();

    /** Turmas não excluídas do curso no período vigente. */
    List<Turma> listarDoCurso(String cursoCodigo);

    Optional<Turma> buscar(long id);

    /** Todas as turmas do curso cuja disciplina da matriz tem a sigla informada (sem diferenciar caixa/acento), por id. */
    List<Turma> listarPorSigla(String cursoCodigo, int matriz, String sigla);

    /** Cria (id nulo) ou atualiza a turma, criando disciplinas/docente/sala se necessário. Devolve a turma gravada. */
    Turma salvar(Turma turma);

    void marcarComoExcluida(long id, Instant quando);

    Optional<Ementa> buscarEmenta(String codigoDaDisciplina);

    record Ementa(String codigo, String nome, String texto, String fonte) { }
}
