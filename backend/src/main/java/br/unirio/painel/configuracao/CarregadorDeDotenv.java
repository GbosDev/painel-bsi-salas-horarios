package br.unirio.painel.configuracao;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Desenvolvimento local: lê o {@code .env} da raiz do projeto (ou da pasta atual) em <b>UTF-8</b>, para que
 * {@code mvnw spring-boot:run} funcione sem exportar variáveis. Tem a menor prioridade: variáveis de ambiente
 * reais sempre vencem. Não é usado no Docker/produção (o arquivo não entra na imagem) nem nos testes
 * ({@code painel.dotenv.habilitado=false}).
 *
 * <p>Substitui {@code spring.config.import=file:.env[.properties]}, que lê o arquivo como ISO-8859-1 e
 * corrompe acentos (ex.: "Coordenação" virava "CoordenaÃ§Ã£o").
 */
public class CarregadorDeDotenv implements EnvironmentPostProcessor, Ordered {

    static final String FONTE = "dotenv-local";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment ambiente, SpringApplication aplicacao) {
        if (!ambiente.getProperty("painel.dotenv.habilitado", Boolean.class, true)) return;
        Path pasta = Path.of(System.getProperty("user.dir"));
        for (Path candidato : List.of(pasta.resolve(".env"), pasta.resolve("..").resolve(".env"))) {
            if (Files.isRegularFile(candidato)) {
                ambiente.getPropertySources().addLast(new MapPropertySource(FONTE, ler(candidato)));
                return;
            }
        }
    }

    static Map<String, Object> ler(Path arquivo) {
        try {
            return interpretar(Files.readAllLines(arquivo, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler " + arquivo, e);
        }
    }

    /** Formato do docker compose: CHAVE=valor, comentários com #, aspas simples/duplas opcionais. */
    static Map<String, Object> interpretar(List<String> linhas) {
        Map<String, Object> valores = new LinkedHashMap<>();
        for (String bruta : linhas) {
            String linha = bruta.strip();
            if (linha.startsWith("﻿")) linha = linha.substring(1);
            if (linha.isEmpty() || linha.startsWith("#")) continue;
            if (linha.startsWith("export ")) linha = linha.substring(7).strip();
            int igual = linha.indexOf('=');
            if (igual <= 0) continue;
            String chave = linha.substring(0, igual).strip();
            String valor = linha.substring(igual + 1).strip();
            if (valor.length() >= 2 && (valor.startsWith("\"") && valor.endsWith("\"") || valor.startsWith("'") && valor.endsWith("'"))) {
                valor = valor.substring(1, valor.length() - 1);
            }
            valores.put(chave, valor);
        }
        return valores;
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE - 1; // antes de PortaDaDocumentacao
    }
}
