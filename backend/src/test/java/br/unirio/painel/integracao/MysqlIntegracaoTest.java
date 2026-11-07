package br.unirio.painel.integracao;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Integração com MySQL real (Testcontainers): Flyway aplica V1..V3, o Hibernate valida o esquema
 * (ddl-auto=validate), a conta inicial é criada pelo ambiente e a API exige autenticação.
 * Requer Docker em execução.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class MysqlIntegracaoTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("painel_teste").withUsername("painel").withPassword("senha-de-teste");

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", MYSQL::getJdbcUrl);
        r.add("spring.datasource.username", MYSQL::getUsername);
        r.add("spring.datasource.password", MYSQL::getPassword);
        r.add("bussola.administrador-inicial.login", () -> "admin.teste");
        r.add("bussola.administrador-inicial.senha", () -> "Senha-Longa-De-Teste-1");
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    @DisplayName("migrações Flyway aplicadas e catálogo de referência presente")
    void migracoes() {
        List<String> versoes = jdbc.queryForList("SELECT version FROM flyway_schema_history WHERE success = 1 ORDER BY installed_rank", String.class);
        assertThat(versoes).containsExactly("1", "2", "3", "4");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM curso", Integer.class)).isEqualTo(7);
        assertThat(jdbc.queryForObject("SELECT situacao FROM curso WHERE codigo = 'mat'", String.class)).isEqualTo("completo");
    }

    @Test
    @DisplayName("API exige autenticação e a saúde é pública")
    void autenticacaoObrigatoria() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/api/v1/cursos")).andExpect(MockMvcResultMatchers.status().isUnauthorized());
        mvc.perform(MockMvcRequestBuilders.get("/actuator/health")).andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @DisplayName("a conta inicial vem do ambiente, com senha em hash (BCrypt)")
    void adminInicial() {
        String hash = jdbc.queryForObject("SELECT senha_hash FROM usuario WHERE login = 'admin.teste'", String.class);
        assertThat(hash).startsWith("$2");
        assertThat(jdbc.queryForObject("SELECT administrador FROM usuario WHERE login = 'admin.teste'", Boolean.class)).isTrue();
    }

    @Test
    @DisplayName("V4: estudante exige matrícula = login; apagar conta preserva o histórico")
    void regrasDeContaNoBanco() {
        String insereAluno = "INSERT INTO usuario (login, nome, senha_hash, perfil, matricula) VALUES (?, 'Aluno', 'x', 'ALUNO', ?)";
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataAccessException.class,
                () -> jdbc.update(insereAluno, "sem.matricula", null));
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataAccessException.class,
                () -> jdbc.update(insereAluno, "outro.login", "20260000001"));
        jdbc.update(insereAluno, "20260000002", "20260000002");
        Long id = jdbc.queryForObject("SELECT id FROM usuario WHERE login = '20260000002'", Long.class);
        Long curso = jdbc.queryForObject("SELECT id FROM curso WHERE codigo = 'bsi'", Long.class);
        jdbc.update("INSERT INTO auditoria_alteracao (usuario_id, autor_nome, autor_perfil, curso_id, tipo, motivo)"
                + " VALUES (?, 'Aluno', 'ALUNO', ?, 'sala_add', 'teste')", id, curso);
        jdbc.update("DELETE FROM usuario WHERE id = ?", id);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM auditoria_alteracao WHERE autor_nome = 'Aluno' AND usuario_id IS NULL",
                Integer.class)).isEqualTo(1);
    }
}
