package br.unirio.painel.auditoria.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "auditoria_alteracao")
public class AuditoriaJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ocorrida_em", nullable = false)
    private Instant ocorridaEm;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "autor_nome", nullable = false)
    private String autorNome;

    @Column(name = "autor_perfil", nullable = false)
    private String autorPerfil;

    @Column(name = "curso_id", nullable = false)
    private Long cursoId;

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "turma_id")
    private Long turmaId;

    @Column(name = "turma_sigla")
    private String turmaSigla;

    @Column(name = "turma_nome")
    private String turmaNome;

    @Column(name = "motivo", nullable = false)
    private String motivo;

    @Column(name = "antes_json", columnDefinition = "LONGTEXT")
    private String antesJson;

    @Column(name = "depois_json", columnDefinition = "LONGTEXT")
    private String depoisJson;

    @Column(name = "importacao_lote_id")
    private Long importacaoLoteId;

    protected AuditoriaJpa() { }

    public AuditoriaJpa(Instant ocorridaEm, Long usuarioId, String autorNome, String autorPerfil, Long cursoId, String tipo,
                        Long turmaId, String turmaSigla, String turmaNome, String motivo, String antesJson, String depoisJson,
                        Long importacaoLoteId) {
        this.ocorridaEm = ocorridaEm;
        this.usuarioId = usuarioId;
        this.autorNome = autorNome;
        this.autorPerfil = autorPerfil;
        this.cursoId = cursoId;
        this.tipo = tipo;
        this.turmaId = turmaId;
        this.turmaSigla = turmaSigla;
        this.turmaNome = turmaNome;
        this.motivo = motivo;
        this.antesJson = antesJson;
        this.depoisJson = depoisJson;
        this.importacaoLoteId = importacaoLoteId;
    }

    public Long getId() { return id; }
    public Instant getOcorridaEm() { return ocorridaEm; }
    public Long getUsuarioId() { return usuarioId; }
    public String getAutorNome() { return autorNome; }
    public String getAutorPerfil() { return autorPerfil; }
    public Long getCursoId() { return cursoId; }
    public String getTipo() { return tipo; }
    public Long getTurmaId() { return turmaId; }
    public String getTurmaSigla() { return turmaSigla; }
    public String getTurmaNome() { return turmaNome; }
    public String getMotivo() { return motivo; }
    public String getAntesJson() { return antesJson; }
    public String getDepoisJson() { return depoisJson; }
    public Long getImportacaoLoteId() { return importacaoLoteId; }
}
