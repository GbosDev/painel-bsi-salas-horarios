package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class SubjectEmbeddable {

    @Column(length = 150)
    private String nome;

    @Column(length = 20)
    private String sigla;

    @Column(length = 30)
    private String codigo;

    @Column(length = 10)
    private String periodo;

    private boolean ppgi;

    protected SubjectEmbeddable() {}

    public SubjectEmbeddable(String nome, String sigla, String codigo, String periodo, boolean ppgi) {
        this.nome = nome;
        this.sigla = sigla;
        this.codigo = codigo;
        this.periodo = periodo;
        this.ppgi = ppgi;
    }

    public String getNome() { return nome; }
    public String getSigla() { return sigla; }
    public String getCodigo() { return codigo; }
    public String getPeriodo() { return periodo; }
    public boolean isPpgi() { return ppgi; }
}
