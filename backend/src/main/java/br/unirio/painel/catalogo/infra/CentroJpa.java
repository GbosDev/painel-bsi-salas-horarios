package br.unirio.painel.catalogo.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "centro")
public class CentroJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sigla", nullable = false)
    private String sigla;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "descricao")
    private String descricao;

    protected CentroJpa() { }

    public Long getId() { return id; }
    public String getSigla() { return sigla; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
}
