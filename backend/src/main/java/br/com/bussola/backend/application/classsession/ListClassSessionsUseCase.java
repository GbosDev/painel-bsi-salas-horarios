package br.com.bussola.backend.application.classsession;

import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.course.CourseId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListClassSessionsUseCase {

    private final ClassSessionRepository classSessionRepository;

    public ListClassSessionsUseCase(ClassSessionRepository classSessionRepository) {
        this.classSessionRepository = classSessionRepository;
    }

    public List<ClassSession> execute(String courseId) {
        return classSessionRepository.findByCourseId(CourseId.of(courseId));
    }
}
