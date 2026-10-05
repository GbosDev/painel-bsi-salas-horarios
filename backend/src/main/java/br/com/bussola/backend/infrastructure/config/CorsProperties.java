package br.com.bussola.backend.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "bussola.cors")
public class CorsProperties {

    /** Explicit allow-list — never "*" alongside allowCredentials(true). */
    private List<String> allowedOrigins = List.of("http://localhost:4200");

    public List<String> getAllowedOrigins() { return allowedOrigins; }
    public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
}
