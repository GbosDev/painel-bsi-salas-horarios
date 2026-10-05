package br.com.bussola.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BussolaBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BussolaBackendApplication.class, args);
    }
}
