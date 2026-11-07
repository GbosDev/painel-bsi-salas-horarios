package br.unirio.painel.catalogo.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "curso")
public class CursoJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "centro_id", nullable = false)
    private CentroJpa centro;

    @Column(name = "codigo", nullable = false)
    private String codigo;

    @Column(name = "sigla", nullable = false)
    private String sigla;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "situacao", nullable = false)
    private String situacao;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "tema", nullable = false)
    private String tema;

    @Column(name = "alterna_matrizes", nullable = false)
    private boolean alternaMatrizes;

    @Column(name = "duracao_aula_horas", nullable = false, columnDefinition = "SMALLINT")
    private int duracaoAulaHoras;

    @Column(name = "ordem", nullable = false)
    private int ordem;

    protected CursoJpa() { }

    public Long getId() { return id; }
    public CentroJpa getCentro() { return centro; }
    public String getCodigo() { return codigo; }
    public String getSigla() { return sigla; }
    public String getNome() { return nome; }
    public String getSituacao() { return situacao; }
    public String getDescricao() { return descricao; }
    public String getTema() { return tema; }
    public boolean isAlternaMatrizes() { return alternaMatrizes; }
    public int getDuracaoAulaHoras() { return duracaoAulaHoras; }
    public int getOrdem() { return ordem; }
}
