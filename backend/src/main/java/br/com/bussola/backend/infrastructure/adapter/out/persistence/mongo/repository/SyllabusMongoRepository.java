package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document.SyllabusDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SyllabusMongoRepository extends MongoRepository<SyllabusDocument, String> {
}
