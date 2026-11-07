package br.unirio.painel.auditoria.dominio;

/** Tipos gravados em auditoria_alteracao.tipo (mesmos códigos do painel original). */
public enum TipoDeAlteracao {
    CSV_CRIADA("csv_criada"),
    CSV_ATUALIZADA("csv_atualizada"),
    EXCEPCIONAL_EDICAO("exceptional_edit"),
    EXCEPCIONAL_CRIACAO("exceptional_create"),
    EXCEPCIONAL_EXCLUSAO("exceptional_delete"),
    SALA_ADICIONADA("sala_add"),
    SALA_REMOVIDA("sala_remove");

    private final String codigo;

    TipoDeAlteracao(String codigo) { this.codigo = codigo; }

    public String codigo() { return codigo; }

    public static TipoDeAlteracao deCodigo(String codigo) {
        for (TipoDeAlteracao t : values()) if (t.codigo.equals(codigo)) return t;
        throw new IllegalArgumentException("Tipo de alteração desconhecido: " + codigo);
    }
}
