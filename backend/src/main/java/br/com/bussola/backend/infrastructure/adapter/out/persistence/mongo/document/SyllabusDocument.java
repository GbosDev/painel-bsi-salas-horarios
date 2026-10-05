package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Mirrors window.BSI_EMENTAS — long free-text that varies per curriculum/course. */
@Document(collection = "syllabus")
public class SyllabusDocument {

    @Id
    private String codigo;
    private String nome;
    private String ementa;

    protected SyllabusDocument() {}

    public SyllabusDocument(String codigo, String nome, String ementa) {
        this.codigo = codigo;
        this.nome = nome;
        this.ementa = ementa;
    }

    public String getCodigo() { return codigo; }
    public String getNome() { return nome; }
    public String getEmenta() { return ementa; }
}
