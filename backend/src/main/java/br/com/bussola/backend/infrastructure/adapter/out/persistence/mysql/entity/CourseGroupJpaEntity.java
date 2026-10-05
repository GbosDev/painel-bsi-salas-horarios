package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "course_group")
public class CourseGroupJpaEntity {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 40)
    private String sigla;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 500)
    private String descricao;

    protected CourseGroupJpaEntity() {}

    public CourseGroupJpaEntity(String id, String sigla, String nome, String descricao) {
        this.id = id;
        this.sigla = sigla;
        this.nome = nome;
        this.descricao = descricao;
    }

    public String getId() { return id; }
    public String getSigla() { return sigla; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
}
