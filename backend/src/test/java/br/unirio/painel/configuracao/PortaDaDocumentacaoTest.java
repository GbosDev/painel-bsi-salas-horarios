package br.unirio.painel.configuracao;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

class PortaDaDocumentacaoTest {

    private static Boolean decidir(Map<String, Object> props) {
        StandardEnvironment ambiente = new StandardEnvironment();
        ambiente.getPropertySources().addFirst(new MapPropertySource("teste", props));
        new PortaDaDocumentacao().postProcessEnvironment(ambiente, null);
        return ambiente.getProperty("springdoc.use-management-port", Boolean.class);
    }

    @Test
    @DisplayName("porta de gerenciamento própria (dev local) liga o Swagger nela")
    void portaPropria() {
        assertThat(decidir(Map.of("server.port", "8080", "management.server.port", "8081"))).isTrue();
    }

    @Test
    @DisplayName("sem porta própria (Docker/produção/testes) o Swagger fica no caminho padrão da API")
    void semPortaPropria() {
        assertThat(decidir(Map.of("server.port", "8080", "management.server.port", ""))).isFalse();
        assertThat(decidir(Map.of("server.port", "8080"))).isFalse();
        assertThat(decidir(Map.of("server.port", "8080", "management.server.port", "8080"))).isFalse();
    }

    @Test
    @DisplayName("valor explícito é respeitado")
    void explicito() {
        assertThat(decidir(Map.of("management.server.port", "8081", "springdoc.use-management-port", "false"))).isFalse();
    }
}
