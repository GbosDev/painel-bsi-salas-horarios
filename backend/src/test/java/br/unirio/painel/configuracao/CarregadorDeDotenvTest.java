package br.unirio.painel.configuracao;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class CarregadorDeDotenvTest {

    @Test
    @DisplayName("lê o .env em UTF-8 (acentos preservados)")
    void utf8(@TempDir Path pasta) throws Exception {
        Path env = pasta.resolve(".env");
        Files.writeString(env, "ADMIN_NOME=Coordenação\n", StandardCharsets.UTF_8);
        assertThat(CarregadorDeDotenv.ler(env)).containsEntry("ADMIN_NOME", "Coordenação");
    }

    @Test
    @DisplayName("ignora comentários e linhas vazias, remove aspas e aceita 'export'")
    void formato() {
        Map<String, Object> v = CarregadorDeDotenv.interpretar(List.of(
                "# comentário", "", "A=1", "B = 'com espaço' ", "C=\"x=y\"", "export D=4", "VAZIA=", "sem_igual"));
        assertThat(v).containsEntry("A", "1").containsEntry("B", "com espaço").containsEntry("C", "x=y")
                .containsEntry("D", "4").containsEntry("VAZIA", "").doesNotContainKey("sem_igual");
    }
}
