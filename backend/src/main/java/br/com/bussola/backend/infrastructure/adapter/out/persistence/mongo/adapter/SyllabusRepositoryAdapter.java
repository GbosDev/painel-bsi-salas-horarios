package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.adapter;

import br.com.bussola.backend.domain.syllabus.Syllabus;
import br.com.bussola.backend.domain.syllabus.SyllabusRepository;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document.SyllabusDocument;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.repository.SyllabusMongoRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SyllabusRepositoryAdapter implements SyllabusRepository {

    private final SyllabusMongoRepository mongoRepository;

    public SyllabusRepositoryAdapter(SyllabusMongoRepository mongoRepository) {
        this.mongoRepository = mongoRepository;
    }

    @Override
    public Optional<Syllabus> findByCodigo(String codigo) {
        return mongoRepository.findById(codigo)
                .map(d -> new Syllabus(d.getCodigo(), d.getNome(), d.getEmenta()));
    }

    @Override
    public Syllabus save(Syllabus syllabus) {
        var saved = mongoRepository.save(
                new SyllabusDocument(syllabus.codigo(), syllabus.nome(), syllabus.ementa()));
        return new Syllabus(saved.getCodigo(), saved.getNome(), saved.getEmenta());
    }
}
