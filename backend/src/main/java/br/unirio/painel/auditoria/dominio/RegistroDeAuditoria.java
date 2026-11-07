package br.unirio.painel.auditoria.dominio;

import java.time.Instant;
import java.util.Map;

public record RegistroDeAuditoria(
        Long id,
        Instant ocorridaEm,
        Autor autor,
        String cursoCodigo,
        String cursoNome,
        TipoDeAlteracao tipo,
        Long turmaId,
        String turmaSigla,
        String turmaNome,
        String motivo,
        Map<String, Object> antes,
        Map<String, Object> depois,
        Long importacaoLoteId) { }
