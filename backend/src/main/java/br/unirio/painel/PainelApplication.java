package br.unirio.painel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PainelApplication {

    public static void main(String[] args) {
        SpringApplication.run(PainelApplication.class, args);
    }
}
