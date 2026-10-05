package br.com.bussola.backend.domain.audit;

import br.com.bussola.backend.domain.classsession.ClassSessionId;

import java.util.List;

public interface AuditLogRepository {
    AuditLogEntry append(AuditLogEntry entry);
    List<AuditLogEntry> findByClassSessionId(ClassSessionId classSessionId);
}
