package br.unirio.painel.configuracao;

import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Sessão de conta desativada ou apagada deixa de valer imediatamente: a cada requisição autenticada da API,
 * confere se a conta ainda existe e está ativa. Se não, encerra a sessão e responde 401.
 */
public class FiltroDeContaAtiva extends OncePerRequestFilter {

    private final ServicoDeUsuarios usuarios;
    private final ObjectMapper json;

    public FiltroDeContaAtiva(ServicoDeUsuarios usuarios, ObjectMapper json) {
        this.usuarios = usuarios;
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioAutenticado u && !usuarios.contaAtiva(u.id())) {
            HttpSession sessao = request.getSession(false);
            if (sessao != null) sessao.invalidate();
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            json.writeValue(response.getWriter(), RespostaDeErro.de(HttpStatus.UNAUTHORIZED, "conta_inativa",
                    "Sua conta foi desativada ou removida. Fale com a coordenação.", List.of(), request.getRequestURI()));
            return;
        }
        chain.doFilter(request, response);
    }
}
