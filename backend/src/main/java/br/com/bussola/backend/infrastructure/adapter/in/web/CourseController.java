package br.com.bussola.backend.infrastructure.adapter.in.web;

import br.com.bussola.backend.application.course.ListCoursesUseCase;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.CourseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final ListCoursesUseCase listCoursesUseCase;

    public CourseController(ListCoursesUseCase listCoursesUseCase) {
        this.listCoursesUseCase = listCoursesUseCase;
    }

    @GetMapping
    public ResponseEntity<CourseResponse.Catalog> list() {
        var result = listCoursesUseCase.execute();
        return ResponseEntity.ok(new CourseResponse.Catalog(
                result.courses().stream().map(CourseResponse::from).toList(),
                result.groups().stream().map(CourseResponse.GroupResponse::from).toList()
        ));
    }
}
