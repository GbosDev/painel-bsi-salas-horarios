package br.unirio.painel.acesso.aplicacao;

/** Porta de saída: hash de senha (BCrypt na infraestrutura). */
public interface CodificadorDeSenha {

    String codificar(String senhaEmTextoPuro);

    boolean confere(String senhaEmTextoPuro, String hash);
}
