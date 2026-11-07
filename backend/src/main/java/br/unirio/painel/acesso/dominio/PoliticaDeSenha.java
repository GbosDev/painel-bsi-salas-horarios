package br.unirio.painel.acesso.dominio;

import br.unirio.painel.compartilhado.ErroDeNegocio;

/** Regras mínimas de senha: tamanho, letra e número, e diferente do login. */
public final class PoliticaDeSenha {

    public static final int TAMANHO_MINIMO = 10;
    public static final int TAMANHO_MAXIMO = 72; // limite do BCrypt

    private PoliticaDeSenha() { }

    public static void validar(String senha, String login) {
        if (senha == null || senha.length() < TAMANHO_MINIMO) {
            throw ErroDeNegocio.invalido("senha_fraca", "A senha deve ter pelo menos " + TAMANHO_MINIMO + " caracteres.");
        }
        if (senha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > TAMANHO_MAXIMO) {
            throw ErroDeNegocio.invalido("senha_longa", "A senha deve ter no máximo " + TAMANHO_MAXIMO + " bytes.");
        }
        boolean letra = senha.chars().anyMatch(Character::isLetter);
        boolean numero = senha.chars().anyMatch(Character::isDigit);
        if (!letra || !numero) {
            throw ErroDeNegocio.invalido("senha_fraca", "A senha deve misturar letras e números.");
        }
        if (login != null && senha.equalsIgnoreCase(login)) {
            throw ErroDeNegocio.invalido("senha_fraca", "A senha não pode ser igual ao login.");
        }
    }
}
