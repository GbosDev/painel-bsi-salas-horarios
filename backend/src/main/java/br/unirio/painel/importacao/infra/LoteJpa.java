package br.unirio.painel.importacao.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "importacao_lote")
public class LoteJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Column(name = "curso_id")
    private Long cursoId;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "nome_arquivo")
    private String nomeArquivo;

    @Column(name = "hash_sha256", columnDefinition = "CHAR(64)")
    private String hashSha256;

    @Column(name = "situacao", nullable = false)
    private String situacao;

    @Column(name = "observacao")
    private String observacao;

    @Column(name = "total_linhas", nullable = false)
    private int totalLinhas;

    @Column(name = "total_ok", nullable = false)
    private int totalOk;

    @Column(name = "total_aviso", nullable = false)
    private int totalAviso;

    @Column(name = "total_erro", nullable = false)
    private int totalErro;

    @Column(name = "total_criadas", nullable = false)
    private int totalCriadas;

    @Column(name = "total_atualizadas", nullable = false)
    private int totalAtualizadas;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    @Column(name = "aplicado_em")
    private Instant aplicadoEm;

    protected LoteJpa() { }

    public LoteJpa(String tipo, Long cursoId, Long usuarioId, String nomeArquivo, String hashSha256, String situacao,
                   int totalLinhas, int totalOk, int totalAviso, int totalErro, Instant criadoEm) {
        this.tipo = tipo;
        this.cursoId = cursoId;
        this.usuarioId = usuarioId;
        this.nomeArquivo = nomeArquivo;
        this.hashSha256 = hashSha256;
        this.situacao = situacao;
        this.totalLinhas = totalLinhas;
        this.totalOk = totalOk;
        this.totalAviso = totalAviso;
        this.totalErro = totalErro;
        this.criadoEm = criadoEm;
    }

    public Long getId() { return id; }
    public Long getCursoId() { return cursoId; }
    public String getNomeArquivo() { return nomeArquivo; }
    public String getHashSha256() { return hashSha256; }
    public String getSituacao() { return situacao; }
    public int getTotalLinhas() { return totalLinhas; }
    public int getTotalOk() { return totalOk; }
    public int getTotalAviso() { return totalAviso; }
    public int getTotalErro() { return totalErro; }

    public Instant getAplicadoEmOuNull() { return aplicadoEm; }

    public void aplicar(String observacao, int criadas, int atualizadas, Instant quando) {
        this.situacao = "APLICADO";
        this.observacao = observacao;
        this.totalCriadas = criadas;
        this.totalAtualizadas = atualizadas;
        this.aplicadoEm = quando;
    }
}
