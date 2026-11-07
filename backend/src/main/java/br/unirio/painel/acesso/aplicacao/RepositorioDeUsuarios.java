package br.unirio.painel.acesso.aplicacao;

import br.unirio.painel.acesso.dominio.Usuario;
import java.util.List;
import java.util.Optional;

/** Porta de saída: contas de usuário. */
public interface RepositorioDeUsuarios {

    Optional<Usuario> buscarPorLogin(String login);

    Optional<Usuario> buscarPorMatricula(String matricula);

    Optional<Usuario> buscarPorId(long id);

    List<Usuario> listar();

    long contar();

    boolean existeAdministrador();

    /** Cria (id nulo) ou atualiza; devolve o usuário gravado com id. */
    Usuario salvar(Usuario usuario);

    /** Marca a conta como administração (usado só na partida, para a conta inicial). */
    void marcarComoAdministrador(long id);

    /** Apaga a conta. O plano do estudante vai junto; o histórico mantém o nome do autor. */
    void excluir(long id);
}
