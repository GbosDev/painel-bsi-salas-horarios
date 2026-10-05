package br.com.bussola.backend.domain.course;

import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;

import java.util.Objects;

/**
 * Aggregate root for a course catalog entry (curso). Mirrors a single
 * element of the legacy window.BUSSOLA_COURSES array.
 */
public class Course {

    private final CourseId id;
    private String grupoId;
    private String sigla;
    private String painel;
    private String nome;
    private String unidade;
    private CourseStatus status;
    private String descricao;

    public Course(CourseId id, String grupoId, String sigla, String painel, String nome,
                   String unidade, CourseStatus status, String descricao) {
        this.id = Objects.requireNonNull(id, "id é obrigatório");
        if (sigla == null || sigla.isBlank()) {
            throw new BusinessRuleViolationException("Sigla do curso é obrigatória");
        }
        if (nome == null || nome.isBlank()) {
            throw new BusinessRuleViolationException("Nome do curso é obrigatório");
        }
        this.grupoId = grupoId;
        this.sigla = sigla;
        this.painel = painel;
        this.nome = nome;
        this.unidade = unidade;
        this.status = status == null ? CourseStatus.COMPLETO : status;
        this.descricao = descricao;
    }

    public void rename(String novoNome, String novaDescricao) {
        if (novoNome == null || novoNome.isBlank()) {
            throw new BusinessRuleViolationException("Nome do curso é obrigatório");
        }
        this.nome = novoNome;
        this.descricao = novaDescricao;
    }

    public void markAsScope() {
        this.status = CourseStatus.ESCOPO;
    }

    public void markAsComplete() {
        this.status = CourseStatus.COMPLETO;
    }

    public boolean belongsToGroup(String groupId) {
        return grupoId != null && grupoId.equalsIgnoreCase(groupId);
    }

    public CourseId id() { return id; }
    public String grupoId() { return grupoId; }
    public String sigla() { return sigla; }
    public String painel() { return painel; }
    public String nome() { return nome; }
    public String unidade() { return unidade; }
    public CourseStatus status() { return status; }
    public String descricao() { return descricao; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Course other)) return false;
        return id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
