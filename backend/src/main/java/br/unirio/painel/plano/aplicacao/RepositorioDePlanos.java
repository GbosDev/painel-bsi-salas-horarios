package br.unirio.painel.plano.aplicacao;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de saída: plano de aulas salvo por aluno, curso e período vigente. */
public interface RepositorioDePlanos {

    record PlanoSalvo(List<Long> turmaIds, Instant atualizadoEm) { }

    Optional<PlanoSalvo> buscar(long usuarioId, String cursoCodigo);

    void substituir(long usuarioId, String cursoCodigo, List<Long> turmaIds, Instant quando);
}
