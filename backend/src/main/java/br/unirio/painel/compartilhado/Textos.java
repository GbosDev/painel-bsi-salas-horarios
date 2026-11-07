package br.unirio.painel.compartilhado;

import java.text.Normalizer;
import java.util.Locale;

/** Utilitários de texto usados em várias partes do sistema. */
public final class Textos {

    private Textos() { }

    /** Remove acentos, baixa a caixa e colapsa espaços: usado para comparar siglas, cabeçalhos e nomes. */
    public static String normalizar(String s) {
        if (s == null) return "";
        String semAcento = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return semAcento.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    /** Remove caracteres de controle e colapsa espaços. Nunca devolve null. */
    public static String limpar(String s) {
        if (s == null) return "";
        return s.replaceAll("\\p{Cntrl}", " ").replaceAll("\\s+", " ").trim();
    }

    public static boolean vazio(String s) {
        return s == null || s.isBlank();
    }

    /** Chave de identidade de docente: sem tratamento (Prof., Profa., Dr., Dra.), acentos ou caixa. */
    public static String chaveDeDocente(String nome) {
        String n = normalizar(nome);
        String anterior;
        do {
            anterior = n;
            n = n.replaceFirst("^(professor[a]?|prof[a]?|dr[a]?)(?:[ªº]|\\b)\\.?\\s*", "");
        } while (!n.equals(anterior));
        return n.trim();
    }
}
