package br.unirio.painel.compartilhado;

import java.util.List;

/** Erro previsto pelas regras do sistema; a camada web o converte em resposta HTTP padronizada. */
public class ErroDeNegocio extends RuntimeException {

    public enum Tipo { NAO_ENCONTRADO, CONFLITO, INVALIDO, PROIBIDO, NAO_AUTENTICADO }

    private final Tipo tipo;
    private final String codigo;
    private final List<String> detalhes;

    public ErroDeNegocio(Tipo tipo, String codigo, String mensagem, List<String> detalhes) {
        super(mensagem);
        this.tipo = tipo;
        this.codigo = codigo;
        this.detalhes = detalhes == null ? List.of() : List.copyOf(detalhes);
    }

    public static ErroDeNegocio naoEncontrado(String codigo, String mensagem) {
        return new ErroDeNegocio(Tipo.NAO_ENCONTRADO, codigo, mensagem, List.of());
    }

    public static ErroDeNegocio conflito(String codigo, String mensagem, List<String> detalhes) {
        return new ErroDeNegocio(Tipo.CONFLITO, codigo, mensagem, detalhes);
    }

    public static ErroDeNegocio invalido(String codigo, String mensagem) {
        return new ErroDeNegocio(Tipo.INVALIDO, codigo, mensagem, List.of());
    }

    public static ErroDeNegocio invalido(String codigo, String mensagem, List<String> detalhes) {
        return new ErroDeNegocio(Tipo.INVALIDO, codigo, mensagem, detalhes);
    }

    public static ErroDeNegocio proibido(String codigo, String mensagem) {
        return new ErroDeNegocio(Tipo.PROIBIDO, codigo, mensagem, List.of());
    }

    public static ErroDeNegocio naoAutenticado(String codigo, String mensagem) {
        return new ErroDeNegocio(Tipo.NAO_AUTENTICADO, codigo, mensagem, List.of());
    }

    public Tipo tipo() { return tipo; }
    public String codigo() { return codigo; }
    public List<String> detalhes() { return detalhes; }
}
