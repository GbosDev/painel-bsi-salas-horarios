package br.unirio.painel.importacao.dominio;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Leitor de CSV tolerante: delimitador ",", ";" ou tabulação (detectado pela 1ª linha, ou pela linha "sep=;" do Excel),
 * campos entre aspas, quebras de linha CRLF/LF/CR. Linhas totalmente vazias (ex.: ";;;;") são descartadas.
 */
public final class LeitorDeCsv {

    private LeitorDeCsv() { }

    /** UTF-8 estrito (com ou sem BOM); se houver bytes inválidos, assume Windows-1252 (planilhas do Excel). */
    public static String decodificar(byte[] bytes) {
        byte[] corpo = bytes;
        if (corpo.length >= 3 && (corpo[0] & 0xFF) == 0xEF && (corpo[1] & 0xFF) == 0xBB && (corpo[2] & 0xFF) == 0xBF) {
            corpo = java.util.Arrays.copyOfRange(corpo, 3, corpo.length);
        }
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(corpo)).toString();
        } catch (CharacterCodingException e) {
            return new String(corpo, Charset.forName("windows-1252"));
        }
    }

    public static List<List<String>> ler(String texto) {
        String t = texto.replace("\r\n", "\n").replace('\r', '\n');
        int fim = t.indexOf('\n');
        String primeira = fim < 0 ? t : t.substring(0, fim);
        char delimitador;
        if (primeira.trim().toLowerCase().startsWith("sep=") && primeira.trim().length() == 5) {
            // linha "sep=;" que o Excel grava: define o delimitador e não é dado
            delimitador = primeira.trim().charAt(4);
            t = fim < 0 ? "" : t.substring(fim + 1);
        } else {
            int pv = contar(primeira, ';'), vg = contar(primeira, ','), tab = contar(primeira, '\t');
            delimitador = tab > pv && tab > vg ? '\t' : pv > vg ? ';' : ',';
        }

        List<List<String>> linhas = new ArrayList<>();
        List<String> linha = new ArrayList<>();
        StringBuilder campo = new StringBuilder();
        boolean aspas = false;
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (aspas) {
                if (c == '"') {
                    if (i + 1 < t.length() && t.charAt(i + 1) == '"') { campo.append('"'); i++; }
                    else aspas = false;
                } else campo.append(c);
            } else if (c == '"') {
                aspas = true;
            } else if (c == delimitador) {
                linha.add(campo.toString());
                campo.setLength(0);
            } else if (c == '\n') {
                linha.add(campo.toString());
                campo.setLength(0);
                linhas.add(linha);
                linha = new ArrayList<>();
            } else {
                campo.append(c);
            }
        }
        if (campo.length() > 0 || !linha.isEmpty()) {
            linha.add(campo.toString());
            linhas.add(linha);
        }
        List<List<String>> uteis = new ArrayList<>();
        for (List<String> l : linhas) {
            if (l.stream().anyMatch(c -> !c.isBlank())) uteis.add(l); // ";;;;" do Excel não é linha de dados
        }
        return uteis;
    }

    private static int contar(String s, char c) {
        int n = 0;
        for (int i = 0; i < s.length(); i++) if (s.charAt(i) == c) n++;
        return n;
    }
}
