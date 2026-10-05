package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document.AuditLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AuditLogMongoRepository extends MongoRepository<AuditLogDocument, String> {
    List<AuditLogDocument> findByClassSessionId(Long classSessionId);
}
