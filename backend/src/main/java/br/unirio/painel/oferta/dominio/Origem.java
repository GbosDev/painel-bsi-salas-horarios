package br.unirio.painel.oferta.dominio;

public enum Origem {
    LEGADO("legado"), CSV("csv"), EXCEPCIONAL("excepcional");

    private final String codigo;

    Origem(String codigo) { this.codigo = codigo; }

    public String codigo() { return codigo; }

    public static Origem deCodigo(String c) {
        for (Origem o : values()) if (o.codigo.equals(c)) return o;
        return CSV;
    }
}
