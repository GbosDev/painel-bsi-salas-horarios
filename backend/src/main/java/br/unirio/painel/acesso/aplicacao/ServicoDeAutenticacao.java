package br.unirio.painel.acesso.aplicacao;

import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import java.time.Clock;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServicoDeAutenticacao {

    private static final String MENSAGEM_PADRAO = "Usuário ou senha incorretos.";

    private final RepositorioDeUsuarios usuarios;
    private final CodificadorDeSenha codificador;
    private final Clock relogio;
    private final String hashFalso;

    public ServicoDeAutenticacao(RepositorioDeUsuarios usuarios, CodificadorDeSenha codificador, Clock relogio) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.relogio = relogio;
        // hash descartável para gastar o mesmo tempo quando o login não existe (evita enumeração por tempo de resposta)
        this.hashFalso = codificador.codificar("senha-descartavel-" + System.nanoTime());
    }

    /** Falhas incrementam o contador do usuário; por isso a transação grava mesmo quando devolve erro (sem rollback). */
    @Transactional(noRollbackFor = ErroDeNegocio.class)
    public Usuario autenticar(String login, String senha) {
        String l = login == null ? "" : login.trim().toLowerCase();
        String s = senha == null ? "" : senha;
        var encontrado = usuarios.buscarPorLogin(l);
        if (encontrado.isEmpty()) {
            codificador.confere(s, hashFalso);
            throw ErroDeNegocio.naoAutenticado("credenciais_invalidas", MENSAGEM_PADRAO);
        }
        Usuario u = encontrado.get();
        var agora = relogio.instant();
        if (!u.ativo()) {
            codificador.confere(s, hashFalso);
            throw ErroDeNegocio.naoAutenticado("credenciais_invalidas", MENSAGEM_PADRAO);
        }
        if (u.bloqueado(agora)) {
            throw ErroDeNegocio.naoAutenticado("conta_bloqueada",
                    "Muitas tentativas incorretas. Tente novamente em alguns minutos.");
        }
        if (!codificador.confere(s, u.senhaHash())) {
            u.registrarFalha(agora);
            usuarios.salvar(u);
            throw ErroDeNegocio.naoAutenticado("credenciais_invalidas", MENSAGEM_PADRAO);
        }
        u.registrarSucesso();
        return usuarios.salvar(u);
    }
}
