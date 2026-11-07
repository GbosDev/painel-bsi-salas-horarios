package br.unirio.painel.oferta.dominio;

public enum Secao {
    REGULAR("regular"), POS("pos");

    private final String codigo;

    Secao(String codigo) { this.codigo = codigo; }

    public String codigo() { return codigo; }

    public static Secao deCodigo(String c) {
        return "pos".equalsIgnoreCase(c == null ? "" : c.trim()) ? POS : REGULAR;
    }
}
