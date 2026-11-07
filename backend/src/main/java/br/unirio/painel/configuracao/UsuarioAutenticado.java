package br.unirio.painel.configuracao;

import br.unirio.painel.acesso.dominio.Perfil;
import br.unirio.painel.auditoria.dominio.Autor;
import java.io.Serializable;

/** Principal guardado na sessão HTTP do servidor. */
public record UsuarioAutenticado(Long id, String login, String nome, Perfil perfil, String matricula, boolean administrador)
        implements Serializable {

    public Autor comoAutor() {
        return new Autor(id, nome, perfil.name());
    }
}
