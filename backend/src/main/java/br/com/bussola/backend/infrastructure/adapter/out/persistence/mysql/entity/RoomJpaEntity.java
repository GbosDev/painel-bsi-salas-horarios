package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "room", uniqueConstraints = @UniqueConstraint(columnNames = {"course_id", "nome"}))
public class RoomJpaEntity {

    @Id
    @Column(length = 40)
    private String id;

    @Column(name = "course_id", nullable = false, length = 40)
    private String courseId;

    @Column(nullable = false, length = 80)
    private String nome;

    protected RoomJpaEntity() {}

    public RoomJpaEntity(String id, String courseId, String nome) {
        this.id = id;
        this.courseId = courseId;
        this.nome = nome;
    }

    public String getId() { return id; }
    public String getCourseId() { return courseId; }
    public String getNome() { return nome; }
}
