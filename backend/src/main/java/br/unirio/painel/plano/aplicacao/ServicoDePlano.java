package br.unirio.painel.plano.aplicacao;

import br.unirio.painel.catalogo.aplicacao.RepositorioDeCatalogo;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.oferta.aplicacao.RepositorioDeTurmas;
import br.unirio.painel.oferta.dominio.ConflitoDeHorario;
import br.unirio.painel.oferta.dominio.ConflitosDeHorario;
import br.unirio.painel.oferta.dominio.Turma;
import br.unirio.painel.plano.aplicacao.RepositorioDePlanos.PlanoSalvo;
import java.time.Clock;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Meu plano": o aluno escolhe turmas do curso; o servidor recusa planos com choque de horário. */
@Service
public class ServicoDePlano {

    private final RepositorioDePlanos planos;
    private final RepositorioDeTurmas turmas;
    private final RepositorioDeCatalogo catalogo;
    private final Clock relogio;

    public ServicoDePlano(RepositorioDePlanos planos, RepositorioDeTurmas turmas, RepositorioDeCatalogo catalogo, Clock relogio) {
        this.planos = planos;
        this.turmas = turmas;
        this.catalogo = catalogo;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true)
    public PlanoSalvo obter(long usuarioId, String cursoCodigo) {
        exigirCurso(cursoCodigo);
        List<Long> existentes = turmas.listarDoCurso(cursoCodigo).stream().map(Turma::id).toList();
        return planos.buscar(usuarioId, cursoCodigo)
                .map(p -> new PlanoSalvo(p.turmaIds().stream().filter(existentes::contains).toList(), p.atualizadoEm()))
                .orElse(new PlanoSalvo(List.of(), null));
    }

    @Transactional
    public PlanoSalvo salvar(long usuarioId, String cursoCodigo, List<Long> turmaIdsSolicitadas) {
        exigirCurso(cursoCodigo);
        List<Long> ids = turmaIdsSolicitadas == null ? List.of() : List.copyOf(new LinkedHashSet<>(turmaIdsSolicitadas));
        Map<Long, Turma> doCurso = turmas.listarDoCurso(cursoCodigo).stream()
                .collect(Collectors.toMap(Turma::id, Function.identity()));
        List<String> invalidas = ids.stream().filter(id -> !doCurso.containsKey(id)).map(String::valueOf).toList();
        if (!invalidas.isEmpty()) {
            throw ErroDeNegocio.invalido("plano_turma_invalida",
                    "Há turmas que não existem neste curso ou foram removidas.", invalidas);
        }
        List<ConflitoDeHorario> conflitos = ConflitosDeHorario.entre(ids.stream().map(doCurso::get).toList());
        if (!conflitos.isEmpty()) {
            throw new PlanoComConflitoException(conflitos);
        }
        var agora = relogio.instant();
        planos.substituir(usuarioId, cursoCodigo, ids, agora);
        return new PlanoSalvo(ids, agora);
    }

    private void exigirCurso(String codigo) {
        catalogo.curso(codigo).orElseThrow(() -> ErroDeNegocio.naoEncontrado("curso_nao_encontrado", "Curso não encontrado: " + codigo));
    }
}
