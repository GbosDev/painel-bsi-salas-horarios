package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.adapter;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.room.Room;
import br.com.bussola.backend.domain.room.RoomId;
import br.com.bussola.backend.domain.room.RoomRepository;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper.RoomMapper;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository.RoomJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class RoomRepositoryAdapter implements RoomRepository {

    private final RoomJpaRepository jpaRepository;

    public RoomRepositoryAdapter(RoomJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<Room> findByCourseId(CourseId courseId) {
        return jpaRepository.findByCourseId(courseId.value()).stream().map(RoomMapper::toDomain).toList();
    }

    @Override
    public Optional<Room> findByCourseIdAndNome(CourseId courseId, String nome) {
        return jpaRepository.findByCourseIdAndNomeIgnoreCase(courseId.value(), nome).map(RoomMapper::toDomain);
    }

    @Override
    public Room save(Room room) {
        var saved = jpaRepository.save(RoomMapper.toEntity(room));
        return RoomMapper.toDomain(saved);
    }

    @Override
    public void deleteById(RoomId id) {
        jpaRepository.deleteById(id.value());
    }
}
