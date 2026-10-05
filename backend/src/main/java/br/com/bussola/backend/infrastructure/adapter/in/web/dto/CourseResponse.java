package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.domain.course.Course;
import br.com.bussola.backend.domain.course.CourseGroup;

import java.util.List;

public record CourseResponse(String id, String grupo, String sigla, String painel, String nome,
                               String unidade, String status, String descricao) {
    public static CourseResponse from(Course c) {
        return new CourseResponse(c.id().value(), c.grupoId(), c.sigla(), c.painel(), c.nome(),
                c.unidade(), c.status().name().toLowerCase(), c.descricao());
    }

    public record GroupResponse(String id, String sigla, String nome, String descricao) {
        public static GroupResponse from(CourseGroup g) {
            return new GroupResponse(g.id(), g.sigla(), g.nome(), g.descricao());
        }
    }

    public record Catalog(List<CourseResponse> courses, List<GroupResponse> groups) {}
}
