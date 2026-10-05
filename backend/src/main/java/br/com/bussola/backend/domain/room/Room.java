package br.com.bussola.backend.domain.room;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;

import java.util.Objects;

/** A physical (or virtual "sem sala fixa") room scoped to a course. */
public class Room {

    private final RoomId id;
    private final CourseId courseId;
    private String nome;

    public Room(RoomId id, CourseId courseId, String nome) {
        this.id = Objects.requireNonNull(id);
        this.courseId = Objects.requireNonNull(courseId);
        if (nome == null || nome.isBlank()) {
            throw new BusinessRuleViolationException("Nome da sala é obrigatório");
        }
        this.nome = nome.trim();
    }

    public static Room create(CourseId courseId, String nome) {
        return new Room(RoomId.generate(), courseId, nome);
    }

    public RoomId id() { return id; }
    public CourseId courseId() { return courseId; }
    public String nome() { return nome; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Room other)) return false;
        return id.equals(other.id);
    }

    @Override
    public int hashCode() { return id.hashCode(); }
}
