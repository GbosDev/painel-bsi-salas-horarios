package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "course")
public class CourseJpaEntity {

    @Id
    @Column(length = 40)
    private String id;

    @Column(name = "grupo_id", length = 40)
    private String grupoId;

    @Column(nullable = false, length = 40)
    private String sigla;

    @Column(length = 40)
    private String painel;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 80)
    private String unidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusJpa status;

    @Column(length = 1000)
    private String descricao;

    public enum StatusJpa { COMPLETO, ESCOPO }

    protected CourseJpaEntity() {}

    public CourseJpaEntity(String id, String grupoId, String sigla, String painel, String nome,
                             String unidade, StatusJpa status, String descricao) {
        this.id = id;
        this.grupoId = grupoId;
        this.sigla = sigla;
        this.painel = painel;
        this.nome = nome;
        this.unidade = unidade;
        this.status = status;
        this.descricao = descricao;
    }

    public String getId() { return id; }
    public String getGrupoId() { return grupoId; }
    public String getSigla() { return sigla; }
    public String getPainel() { return painel; }
    public String getNome() { return nome; }
    public String getUnidade() { return unidade; }
    public StatusJpa getStatus() { return status; }
    public String getDescricao() { return descricao; }

    public void setNome(String nome) { this.nome = nome; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setStatus(StatusJpa status) { this.status = status; }
}
