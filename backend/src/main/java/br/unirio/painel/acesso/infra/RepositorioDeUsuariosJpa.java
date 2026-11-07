package br.unirio.painel.acesso.infra;

import br.unirio.painel.acesso.aplicacao.RepositorioDeUsuarios;
import br.unirio.painel.acesso.dominio.Perfil;
import br.unirio.painel.acesso.dominio.Usuario;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class RepositorioDeUsuariosJpa implements RepositorioDeUsuarios {

    private final UsuarioJpaRepository jpa;
    private final Clock relogio;

    public RepositorioDeUsuariosJpa(UsuarioJpaRepository jpa, Clock relogio) {
        this.jpa = jpa;
        this.relogio = relogio;
    }

    private static Usuario paraDominio(UsuarioJpa u) {
        return new Usuario(u.getId(), u.getLogin(), u.getNome(), u.getSenhaHash(), Perfil.valueOf(u.getPerfil()),
                u.getMatricula(), u.isAtivo(), u.isAdministrador(), u.getTentativasFalhas(), u.getBloqueadoAte());
    }

    @Override public Optional<Usuario> buscarPorLogin(String login) { return jpa.findByLogin(login).map(RepositorioDeUsuariosJpa::paraDominio); }

    @Override public Optional<Usuario> buscarPorMatricula(String m) { return jpa.findByMatricula(m).map(RepositorioDeUsuariosJpa::paraDominio); }
    @Override public boolean existeAdministrador() { return jpa.existsByAdministradorTrue(); }
    @Override public Optional<Usuario> buscarPorId(long id) { return jpa.findById(id).map(RepositorioDeUsuariosJpa::paraDominio); }

    @Override public List<Usuario> listar() { return jpa.findAll().stream().map(RepositorioDeUsuariosJpa::paraDominio).toList(); }

    @Override public long contar() { return jpa.count(); }

    @Override
    public Usuario salvar(Usuario u) {
        UsuarioJpa e;
        if (u.id() == null) {
            e = new UsuarioJpa(u.login(), u.nome(), u.senhaHash(), u.perfil().name(), u.matricula(), u.ativo(), relogio.instant());
            e.setAdministrador(u.administrador());
        } else {
            e = jpa.findById(u.id()).orElseThrow();
            e.setSenhaHash(u.senhaHash());
            e.setAtivo(u.ativo());
        }
        e.setTentativasFalhas(u.tentativasFalhas());
        e.setBloqueadoAte(u.bloqueadoAte());
        return paraDominio(jpa.save(e));
    }

    @Override
    public void marcarComoAdministrador(long id) {
        jpa.findById(id).ifPresent(e -> {
            e.setAdministrador(true);
            jpa.save(e);
        });
    }

    @Override
    public void excluir(long id) {
        jpa.deleteById(id);
        jpa.flush();
    }
}
