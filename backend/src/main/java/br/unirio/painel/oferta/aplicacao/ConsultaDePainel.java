package br.unirio.painel.oferta.aplicacao;

import br.unirio.painel.catalogo.aplicacao.RepositorioDeCatalogo;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.catalogo.dominio.SalaDoCatalogo;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.oferta.aplicacao.RepositorioDeTurmas.Ementa;
import br.unirio.painel.oferta.dominio.Turma;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Leitura do conjunto de dados de um curso (alimenta todas as abas do painel). */
@Service
public class ConsultaDePainel {

    public record Painel(Curso curso, String periodoLetivo, List<SalaDoCatalogo> salas, List<Turma> turmas) { }

    private final RepositorioDeCatalogo catalogo;
    private final RepositorioDeTurmas turmas;

    public ConsultaDePainel(RepositorioDeCatalogo catalogo, RepositorioDeTurmas turmas) {
        this.catalogo = catalogo;
        this.turmas = turmas;
    }

    @Transactional(readOnly = true)
    public Painel painel(String cursoCodigo) {
        Curso curso = catalogo.curso(cursoCodigo)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("curso_nao_encontrado", "Curso não encontrado: " + cursoCodigo));
        return new Painel(curso, turmas.periodoVigente(), catalogo.salasDoCurso(cursoCodigo), turmas.listarDoCurso(cursoCodigo));
    }

    /** Ementa oficial pelo código da disciplina: matriz 2023 tem prioridade; cai para 2008. */
    @Transactional(readOnly = true)
    public Optional<Ementa> ementaDaTurma(long turmaId) {
        Turma t = turmas.buscar(turmaId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("turma_nao_encontrada", "Turma não encontrada."));
        List<String> codigos = new ArrayList<>();
        if (t.disciplina2023() != null && t.disciplina2023().codigo() != null) codigos.add(t.disciplina2023().codigo());
        if (t.disciplina2008() != null && t.disciplina2008().codigo() != null) codigos.add(t.disciplina2008().codigo());
        for (String c : codigos) {
            Optional<Ementa> e = turmas.buscarEmenta(c);
            if (e.isPresent()) return e;
        }
        return Optional.empty();
    }
}
