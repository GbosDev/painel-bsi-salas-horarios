package br.unirio.painel.plano.infra;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "plano_aluno")
public class PlanoAlunoJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "curso_id", nullable = false)
    private Long cursoId;

    @Column(name = "periodo_letivo_id", nullable = false)
    private Long periodoLetivoId;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "plano_aluno_turma", joinColumns = @JoinColumn(name = "plano_id"))
    @Column(name = "turma_id")
    private Set<Long> turmaIds = new LinkedHashSet<>();

    protected PlanoAlunoJpa() { }

    public PlanoAlunoJpa(Long usuarioId, Long cursoId, Long periodoLetivoId) {
        this.usuarioId = usuarioId;
        this.cursoId = cursoId;
        this.periodoLetivoId = periodoLetivoId;
    }

    public Set<Long> getTurmaIds() { return turmaIds; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(Instant atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
