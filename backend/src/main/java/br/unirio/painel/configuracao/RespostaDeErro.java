package br.unirio.painel.configuracao;

import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * Corpo padrão de todas as respostas de erro: Problem Details (RFC 9457, application/problem+json).
 * Campos padrão: type, title, status, detail, instance. Extensões: codigo (estável, para o front), detalhes, instante.
 */
public record RespostaDeErro(String type, String title, int status, String detail, String instance,
                             String codigo, List<String> detalhes, Instant instante) {

    public static RespostaDeErro de(HttpStatus status, String codigo, String detalhe, List<String> detalhes, String caminho) {
        return new RespostaDeErro("about:blank", status.getReasonPhrase(), status.value(), detalhe, caminho,
                codigo, detalhes == null ? List.of() : detalhes, Instant.now());
    }
}
