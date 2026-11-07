package br.unirio.painel.acesso.api;

import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import br.unirio.painel.acesso.dominio.Perfil;
import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.configuracao.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contas (somente PROFESSOR). Ativar, desativar e apagar: somente a conta de administração
 * (regra aplicada em {@link ServicoDeUsuarios}, que responde 403 para os demais).
 */
@RestController
@RequestMapping("/api/v1/usuarios")
@PreAuthorize("hasRole('PROFESSOR')")
public class UsuarioController {

    /** Estudante: matrícula + nome (o login é a matrícula). Professor: login + nome. */
    public record NovoUsuarioRequisicao(@Size(max = 60) String login, @NotBlank @Size(max = 150) String nome,
                                        @NotBlank @Size(max = 200) String senha, @NotNull Perfil perfil,
                                        @Size(max = 40) String matricula) { }

    public record AtivacaoRequisicao(@NotNull Boolean ativo) { }

    public record UsuarioResumo(long id, String login, String nome, String perfil, String matricula, boolean ativo,
                                boolean administrador) {
        static UsuarioResumo de(Usuario u) {
            return new UsuarioResumo(u.id(), u.login(), u.nome(), u.perfil().name(), u.matricula(), u.ativo(), u.administrador());
        }
    }

    /** Estudantes primeiro, por matrícula; depois professores, por nome. */
    private static final Comparator<Usuario> ORDEM = Comparator
            .comparing((Usuario u) -> u.perfil() == Perfil.ALUNO ? 0 : 1)
            .thenComparing(u -> u.perfil() == Perfil.ALUNO ? String.valueOf(u.matricula()) : u.nome().toLowerCase());

    private final ServicoDeUsuarios usuarios;

    public UsuarioController(ServicoDeUsuarios usuarios) {
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<UsuarioResumo> listar() {
        return usuarios.listar().stream().sorted(ORDEM).map(UsuarioResumo::de).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResumo criar(@Valid @RequestBody NovoUsuarioRequisicao req) {
        return UsuarioResumo.de(usuarios.criar(req.login(), req.nome(), req.senha(), req.perfil(), req.matricula()));
    }

    @PutMapping("/{id}/ativo")
    public UsuarioResumo definirAtivo(@PathVariable long id, @Valid @RequestBody AtivacaoRequisicao req,
                                      @AuthenticationPrincipal UsuarioAutenticado eu) {
        return UsuarioResumo.de(usuarios.definirAtivo(eu.id(), id, req.ativo()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable long id, @AuthenticationPrincipal UsuarioAutenticado eu) {
        usuarios.excluir(eu.id(), id);
    }
}
