package br.com.bussola.backend.domain.user;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;

import java.util.Objects;

/**
 * Aggregate root for an application user. Replaces the legacy
 * UserRepo.users plaintext array: passwordHash is produced and verified
 * by the security adapter (BCrypt), never compared in plain text.
 */
public class User {

    private final UserId id;
    private final String username;
    private String passwordHash;
    private String nome;
    private final Role role;
    private String matricula;
    private final CourseId courseId;

    public User(UserId id, String username, String passwordHash, String nome, Role role,
                 String matricula, CourseId courseId) {
        this.id = Objects.requireNonNull(id);
        if (username == null || username.isBlank()) {
            throw new BusinessRuleViolationException("Usuário é obrigatório");
        }
        this.username = username.trim().toLowerCase();
        this.passwordHash = Objects.requireNonNull(passwordHash, "senha é obrigatória");
        this.nome = nome;
        this.role = Objects.requireNonNull(role);
        this.matricula = matricula;
        this.courseId = courseId;
        if (role == Role.ALUNO && courseId == null) {
            throw new BusinessRuleViolationException("Aluno precisa estar vinculado a um curso");
        }
    }

    public void changePasswordHash(String newHash) {
        this.passwordHash = Objects.requireNonNull(newHash);
    }

    public boolean isProfessor() { return role == Role.PROFESSOR; }
    public boolean isAluno() { return role == Role.ALUNO; }

    public UserId id() { return id; }
    public String username() { return username; }
    public String passwordHash() { return passwordHash; }
    public String nome() { return nome; }
    public Role role() { return role; }
    public String matricula() { return matricula; }
    public CourseId courseId() { return courseId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return id.equals(other.id);
    }

    @Override
    public int hashCode() { return id.hashCode(); }
}
