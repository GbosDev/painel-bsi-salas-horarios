package br.com.bussola.backend.application.course;

import br.com.bussola.backend.domain.course.Course;
import br.com.bussola.backend.domain.course.CourseGroup;
import br.com.bussola.backend.domain.course.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListCoursesUseCase {

    private final CourseRepository courseRepository;

    public ListCoursesUseCase(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public record Result(List<Course> courses, List<CourseGroup> groups) {
    }

    public Result execute() {
        return new Result(courseRepository.findAll(), courseRepository.findAllGroups());
    }
}
