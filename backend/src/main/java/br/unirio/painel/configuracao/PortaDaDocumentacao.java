package br.unirio.painel.configuracao;

import java.util.Map;
import java.util.Objects;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Liga {@code springdoc.use-management-port} somente quando existe porta de gerenciamento PRÓPRIA
 * ({@code management.server.port} definida e diferente de {@code server.port}).
 *
 * <ul>
 *   <li>Dev local ({@code PORTA_DOCS=8081}): Swagger em {@code :8081/actuator/swagger-ui}.</li>
 *   <li>Docker/testes (sem porta própria): Swagger no caminho padrão da API, {@code /swagger-ui/index.html}.</li>
 * </ul>
 * Sem isso, o springdoc falha na partida quando as duas portas coincidem (bean SwaggerWelcomeCommon ausente).
 * Roda depois do {@link CarregadorDeDotenv}, para enxergar o PORTA_DOCS do .env.
 */
public class PortaDaDocumentacao implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment ambiente, SpringApplication aplicacao) {
        if (ambiente.containsProperty("springdoc.use-management-port")) return; // definido explicitamente
        String gerenciamento = ambiente.getProperty("management.server.port", "").trim();
        String api = ambiente.getProperty("server.port", "8080").trim();
        boolean separada = !gerenciamento.isEmpty() && !Objects.equals(gerenciamento, api);
        ambiente.getPropertySources().addLast(
                new MapPropertySource("painel-porta-da-documentacao", Map.of("springdoc.use-management-port", separada)));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
