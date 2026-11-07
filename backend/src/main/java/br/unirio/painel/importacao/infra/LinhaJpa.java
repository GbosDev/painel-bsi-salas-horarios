package br.unirio.painel.importacao.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "importacao_linha")
public class LinhaJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lote_id", nullable = false)
    private Long loteId;

    @Column(name = "numero_linha", nullable = false)
    private int numeroLinha;

    @Column(name = "situacao", nullable = false)
    private String situacao;

    @Column(name = "mensagem")
    private String mensagem;

    @Column(name = "dados_json", columnDefinition = "LONGTEXT")
    private String dadosJson;

    protected LinhaJpa() { }

    public LinhaJpa(Long loteId, int numeroLinha, String situacao, String mensagem, String dadosJson) {
        this.loteId = loteId;
        this.numeroLinha = numeroLinha;
        this.situacao = situacao;
        this.mensagem = mensagem;
        this.dadosJson = dadosJson;
    }

    public int getNumeroLinha() { return numeroLinha; }
    public String getSituacao() { return situacao; }
    public String getMensagem() { return mensagem; }
    public String getDadosJson() { return dadosJson; }
}
