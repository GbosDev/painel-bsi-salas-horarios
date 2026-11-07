package br.unirio.painel.acesso.api;

import br.unirio.painel.acesso.aplicacao.ServicoDeAutenticacao;
import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.configuracao.UsuarioAutenticado;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public record LoginRequisicao(@NotBlank @Size(max = 60) String login, @NotBlank @Size(max = 200) String senha) { }

    public record SenhaRequisicao(@NotBlank @Size(max = 200) String senhaAtual, @NotBlank @Size(max = 200) String novaSenha) { }

    public record UsuarioDto(long id, String login, String nome, String perfil, String matricula, boolean administrador) {
        static UsuarioDto de(UsuarioAutenticado u) {
            return new UsuarioDto(u.id(), u.login(), u.nome(), u.perfil().name(), u.matricula(), u.administrador());
        }
    }

    private final ServicoDeAutenticacao autenticacao;
    private final ServicoDeUsuarios usuarios;
    private final SecurityContextRepository contexto;

    public AuthController(ServicoDeAutenticacao autenticacao, ServicoDeUsuarios usuarios, SecurityContextRepository contexto) {
        this.autenticacao = autenticacao;
        this.usuarios = usuarios;
        this.contexto = contexto;
    }

    /** Qualquer GET emite o cookie XSRF-TOKEN; este endpoint existe para o front obtê-lo antes do login. */
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("cabecalho", token.getHeaderName(), "token", token.getToken());
    }

    @PostMapping("/login")
    public UsuarioDto login(@Valid @RequestBody LoginRequisicao req, HttpServletRequest http, HttpServletResponse resposta) {
        Usuario u = autenticacao.autenticar(req.login(), req.senha());
        // evita fixação de sessão: nova identificação de sessão depois de autenticar
        HttpSession existente = http.getSession(false);
        if (existente != null) http.changeSessionId();
        UsuarioAutenticado principal = new UsuarioAutenticado(u.id(), u.login(), u.nome(), u.perfil(), u.matricula(), u.administrador());
        List<GrantedAuthority> papeis = List.of(new SimpleGrantedAuthority("ROLE_" + u.perfil().name()));
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal, null, papeis));
        SecurityContextHolder.setContext(ctx);
        contexto.saveContext(ctx, http, resposta);
        return UsuarioDto.de(principal);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest http) {
        HttpSession sessao = http.getSession(false);
        if (sessao != null) sessao.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/eu")
    public UsuarioDto eu(@AuthenticationPrincipal UsuarioAutenticado u) {
        if (u == null) throw ErroDeNegocio.naoAutenticado("nao_autenticado", "Faça login para continuar.");
        return UsuarioDto.de(u);
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@AuthenticationPrincipal UsuarioAutenticado u, @Valid @RequestBody SenhaRequisicao req) {
        usuarios.alterarSenha(u.id(), req.senhaAtual(), req.novaSenha());
        return ResponseEntity.noContent().build();
    }
}
