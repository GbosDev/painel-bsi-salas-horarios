package br.unirio.painel.configuracao;

import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Sessão no servidor (cookie HttpOnly, SameSite=Lax), CSRF por cookie + cabeçalho X-XSRF-TOKEN,
 * autorização por perfil (@PreAuthorize) e CORS apenas para origens explicitamente permitidas.
 */
@Configuration
@EnableMethodSecurity
public class SegurancaConfig {

    @Bean
    public SecurityContextRepository repositorioDeContexto() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain cadeiaDeFiltros(HttpSecurity http, ObjectMapper json, SecurityContextRepository contexto,
                                               @Qualifier("configuracaoDeCors") CorsConfigurationSource fonteDeCors,
                                               OrigensDaDocumentacao docs, ServicoDeUsuarios usuarios) throws Exception {
        CookieCsrfTokenRepository csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrf.setCookieName("XSRF-TOKEN");
        csrf.setHeaderName("X-XSRF-TOKEN");
        csrf.setCookiePath("/");

        http
                // O Swagger (outra porta = outra origem) não consegue enviar o cabeçalho CSRF; o navegador não permite
                // forjar o cabeçalho Origin, então só ele é dispensado. Só vale com DOCS_API=true.
                .csrf(c -> c.csrfTokenRepository(csrf).csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        .ignoringRequestMatchers(req -> docs.permite(req.getHeader("Origin"))))
                // Explícito: .cors(withDefaults()) só acha a fonte se o bean se chamar "corsConfigurationSource".
                .cors(c -> c.configurationSource(fonteDeCors))
                .securityContext(c -> c.securityContextRepository(contexto))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(f -> f.changeSessionId()))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        // Swagger: só existe com DOCS_API=true (porta própria em /actuator/…, ou caminho padrão).
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/openapi", "/actuator/openapi/**",
                                "/actuator/swagger-ui", "/actuator/swagger-ui/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/**").authenticated()
                        .anyRequest().denyAll())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> escrever(json, res, 401,
                                RespostaDeErro.de(HttpStatus.UNAUTHORIZED, "nao_autenticado", "Faça login para continuar.", List.of(), req.getRequestURI())))
                        .accessDeniedHandler((req, res, ex) -> escrever(json, res, 403,
                                RespostaDeErro.de(HttpStatus.FORBIDDEN, "acesso_negado", "Você não tem permissão para esta ação.", List.of(), req.getRequestURI()))))
                .addFilterAfter(new FiltroDeCookieCsrf(), BasicAuthenticationFilter.class)
                // conta desativada/apagada perde a sessão na hora
                .addFilterAfter(new FiltroDeContaAtiva(usuarios, json), FiltroDeCookieCsrf.class);
        return http.build();
    }

    /** Origens do Swagger UI (porta de gerenciamento). Vazia quando a documentação está desligada. */
    public record OrigensDaDocumentacao(List<String> origens) {
        /** Null-safe: List.of(...).contains(null) lança NullPointerException (requisição sem cabeçalho Origin). */
        boolean permite(String origem) {
            return origem != null && origens.contains(origem);
        }
    }

    @Bean
    public OrigensDaDocumentacao origensDaDocumentacao(@Value("${springdoc.api-docs.enabled:false}") boolean docsLigada,
                                                       @Value("${management.server.port:}") String portaDocs) {
        if (!docsLigada || portaDocs.isBlank()) return new OrigensDaDocumentacao(List.of());
        return new OrigensDaDocumentacao(List.of("http://localhost:" + portaDocs, "http://127.0.0.1:" + portaDocs));
    }

    @Bean
    public CorsConfigurationSource configuracaoDeCors(PropriedadesDoPainel props, OrigensDaDocumentacao docs) {
        CorsConfiguration cfg = new CorsConfiguration();
        List<String> origens = new ArrayList<>(props.cors() == null || props.cors().origensPermitidas() == null
                ? List.of() : props.cors().origensPermitidas().stream().filter(o -> !o.isBlank()).toList());
        // O Swagger roda na porta de gerenciamento: outra origem, que precisa chamar a API com credenciais.
        origens.addAll(docs.origens());
        cfg.setAllowedOrigins(origens);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(1800L);
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/v1/**", cfg);
        return fonte;
    }

    private static void escrever(ObjectMapper json, HttpServletResponse res, int status, RespostaDeErro corpo) throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        json.writeValue(res.getWriter(), corpo);
    }
}
