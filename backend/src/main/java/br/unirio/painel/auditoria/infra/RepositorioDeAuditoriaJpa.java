package br.unirio.painel.auditoria.infra;

import br.unirio.painel.auditoria.aplicacao.RepositorioDeAuditoria;
import br.unirio.painel.auditoria.dominio.Autor;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import br.unirio.painel.compartilhado.ReferenciasDeCurso;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

@Repository
public class RepositorioDeAuditoriaJpa implements RepositorioDeAuditoria {

    private static final TypeReference<LinkedHashMap<String, Object>> TIPO_MAPA = new TypeReference<>() { };

    private final AuditoriaJpaRepository jpa;
    private final ReferenciasDeCurso cursos;
    private final ObjectMapper json;

    public RepositorioDeAuditoriaJpa(AuditoriaJpaRepository jpa, ReferenciasDeCurso cursos, ObjectMapper json) {
        this.jpa = jpa;
        this.cursos = cursos;
        this.json = json;
    }

    @Override
    public void registrar(RegistroDeAuditoria r) {
        Long cursoId = cursos.idPorCodigo(r.cursoCodigo()).orElseThrow();
        jpa.save(new AuditoriaJpa(r.ocorridaEm(), r.autor().usuarioId(), r.autor().nome(), r.autor().perfil(), cursoId,
                r.tipo().codigo(), r.turmaId(), r.turmaSigla(), r.turmaNome(), r.motivo(),
                paraJson(r.antes()), paraJson(r.depois()), r.importacaoLoteId()));
    }

    @Override
    public List<RegistroDeAuditoria> consultar(FiltroDeAuditoria f) {
        Map<Long, ReferenciasDeCurso.Referencia> cache = new HashMap<>();
        return jpa.consultar(f.cursoCodigo() == null ? "" : f.cursoCodigo(),
                        f.tipo() == null ? "" : f.tipo().codigo(),
                        f.desde() == null ? Instant.EPOCH : f.desde(),
                        f.texto() == null ? "" : f.texto().toLowerCase(Locale.ROOT),
                        PageRequest.of(0, f.limite()))
                .stream().map(a -> paraDominio(a, cache)).toList();
    }

    private RegistroDeAuditoria paraDominio(AuditoriaJpa a, Map<Long, ReferenciasDeCurso.Referencia> cache) {
        ReferenciasDeCurso.Referencia curso = cache.computeIfAbsent(a.getCursoId(), id -> cursos.porId(id).orElseThrow());
        return new RegistroDeAuditoria(a.getId(), a.getOcorridaEm(), new Autor(a.getUsuarioId(), a.getAutorNome(), a.getAutorPerfil()),
                curso.codigo(), curso.nome(), TipoDeAlteracao.deCodigo(a.getTipo()), a.getTurmaId(),
                a.getTurmaSigla(), a.getTurmaNome(), a.getMotivo(), doJson(a.getAntesJson()), doJson(a.getDepoisJson()),
                a.getImportacaoLoteId());
    }

    private String paraJson(Map<String, Object> mapa) {
        try {
            return json.writeValueAsString(mapa == null ? Map.of() : mapa);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha ao serializar auditoria", e);
        }
    }

    private Map<String, Object> doJson(String texto) {
        if (texto == null || texto.isBlank()) return Map.of();
        try {
            return json.readValue(texto, TIPO_MAPA);
        } catch (JsonProcessingException e) {
            return Map.of("erro", "registro ilegível");
        }
    }
}
