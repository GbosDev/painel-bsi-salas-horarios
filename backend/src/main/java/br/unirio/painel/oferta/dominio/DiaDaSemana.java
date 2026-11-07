package br.unirio.painel.oferta.dominio;

/** Dias letivos 1 (segunda) a 6 (sábado), como no painel original. */
public final class DiaDaSemana {

    private static final String[] CURTO = {"", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"};
    private static final String[] COMPLETO = {"", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"};

    private DiaDaSemana() { }

    public static boolean valido(int dia) { return dia >= 1 && dia <= 6; }

    public static String curto(int dia) { return valido(dia) ? CURTO[dia] : "?"; }

    public static String completo(int dia) { return valido(dia) ? COMPLETO[dia] : "?"; }
}
