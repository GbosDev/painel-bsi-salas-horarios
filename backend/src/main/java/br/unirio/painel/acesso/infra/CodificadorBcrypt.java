package br.unirio.painel.acesso.infra;

import br.unirio.painel.acesso.aplicacao.CodificadorDeSenha;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class CodificadorBcrypt implements CodificadorDeSenha {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    @Override public String codificar(String senha) { return encoder.encode(senha); }

    @Override public boolean confere(String senha, String hash) { return encoder.matches(senha, hash); }
}
