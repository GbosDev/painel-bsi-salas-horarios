package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
public class UserJpaEntity {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 60)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(length = 150)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleJpa role;

    @Column(length = 30)
    private String matricula;

    @Column(name = "course_id", length = 40)
    private String courseId;

    public enum RoleJpa { PROFESSOR, ALUNO }

    protected UserJpaEntity() {}

    public UserJpaEntity(String id, String username, String passwordHash, String nome, RoleJpa role,
                           String matricula, String courseId) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.nome = nome;
        this.role = role;
        this.matricula = matricula;
        this.courseId = courseId;
    }

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getNome() { return nome; }
    public RoleJpa getRole() { return role; }
    public String getMatricula() { return matricula; }
    public String getCourseId() { return courseId; }
}
