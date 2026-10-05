package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "class_session", indexes = {
        @Index(name = "idx_class_session_course", columnList = "course_id"),
        @Index(name = "idx_class_session_sala", columnList = "sala")
})
public class ClassSessionJpaEntity {

    @Id
    private Long id;

    @Column(name = "course_id", nullable = false, length = 40)
    private String courseId;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "nome", column = @Column(name = "curr2008_nome")),
            @AttributeOverride(name = "sigla", column = @Column(name = "curr2008_sigla")),
            @AttributeOverride(name = "codigo", column = @Column(name = "curr2008_codigo")),
            @AttributeOverride(name = "periodo", column = @Column(name = "curr2008_periodo")),
            @AttributeOverride(name = "ppgi", column = @Column(name = "curr2008_ppgi"))
    })
    private SubjectEmbeddable curr2008;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "nome", column = @Column(name = "curr2023_nome")),
            @AttributeOverride(name = "sigla", column = @Column(name = "curr2023_sigla")),
            @AttributeOverride(name = "codigo", column = @Column(name = "curr2023_codigo")),
            @AttributeOverride(name = "periodo", column = @Column(name = "curr2023_periodo")),
            @AttributeOverride(name = "ppgi", column = @Column(name = "curr2023_ppgi"))
    })
    private SubjectEmbeddable curr2023;

    @Column(length = 150)
    private String professor;

    @Column(length = 80)
    private String sala;

    private int vagas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SectionJpa section;

    @Column(length = 150)
    private String programa;

    @Column(name = "ementa_url", length = 500)
    private String ementaUrl;

    // EAGER on purpose: this is a small, bounded collection (a turma's weekly
    // slots) that is always needed together with the entity, and
    // open-in-view is disabled, so a LAZY collection throws
    // LazyInitializationException once the mapper reads it outside the
    // repository's transaction.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "class_session_slot", joinColumns = @JoinColumn(name = "class_session_id"))
    private List<WeeklySlotEmbeddable> sessions = new ArrayList<>();

    public enum SectionJpa { REGULAR, POS }

    protected ClassSessionJpaEntity() {}

    public ClassSessionJpaEntity(Long id, String courseId, SubjectEmbeddable curr2008, SubjectEmbeddable curr2023,
                                 String professor, String sala, int vagas, SectionJpa section,
                                 String programa, String ementaUrl, List<WeeklySlotEmbeddable> sessions) {
        this.id = id;
        this.courseId = courseId;
        this.curr2008 = curr2008;
        this.curr2023 = curr2023;
        this.professor = professor;
        this.sala = sala;
        this.vagas = vagas;
        this.section = section;
        this.programa = programa;
        this.ementaUrl = ementaUrl;
        this.sessions = sessions == null ? new ArrayList<>() : sessions;
    }

    public Long getId() { return id; }
    public String getCourseId() { return courseId; }
    public SubjectEmbeddable getCurr2008() { return curr2008; }
    public SubjectEmbeddable getCurr2023() { return curr2023; }
    public String getProfessor() { return professor; }
    public String getSala() { return sala; }
    public int getVagas() { return vagas; }
    public SectionJpa getSection() { return section; }
    public String getPrograma() { return programa; }
    public String getEmentaUrl() { return ementaUrl; }
    public List<WeeklySlotEmbeddable> getSessions() { return sessions; }

    public void setProfessor(String professor) { this.professor = professor; }
    public void setSala(String sala) { this.sala = sala; }
    public void setSessions(List<WeeklySlotEmbeddable> sessions) { this.sessions = sessions; }
}