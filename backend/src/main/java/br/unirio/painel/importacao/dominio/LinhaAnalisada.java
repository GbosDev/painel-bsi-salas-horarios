package br.unirio.painel.importacao.dominio;

/** Resultado da análise de uma linha: ok, aviso (aplicável com ressalva) ou erro (não aplicável). */
public record LinhaAnalisada(int numero, Situacao situacao, String mensagem, RegistroImportado registro) {

    public enum Situacao {
        OK("ok"), AVISO("aviso"), ERRO("erro");

        private final String codigo;

        Situacao(String codigo) { this.codigo = codigo; }

        public String codigo() { return codigo; }

        public static Situacao deCodigo(String c) {
            for (Situacao s : values()) if (s.codigo.equals(c)) return s;
            throw new IllegalArgumentException(c);
        }
    }

    public boolean aplicavel() { return situacao != Situacao.ERRO && registro != null; }
}
