package br.unirio.painel.configuracao;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.plano.aplicacao.PlanoComConflitoException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Traduz erros de negócio e de validação em respostas HTTP padronizadas (sem vazar detalhes internos). */
@RestControllerAdvice
public class ManipuladorDeErros {

    private static final Logger LOG = LoggerFactory.getLogger(ManipuladorDeErros.class);

    @ExceptionHandler(ErroDeNegocio.class)
    public ResponseEntity<RespostaDeErro> negocio(ErroDeNegocio e, HttpServletRequest req) {
        HttpStatus status = switch (e.tipo()) {
            case NAO_ENCONTRADO -> HttpStatus.NOT_FOUND;
            case CONFLITO -> HttpStatus.CONFLICT;
            case INVALIDO -> HttpStatus.UNPROCESSABLE_ENTITY;
            case PROIBIDO -> HttpStatus.FORBIDDEN;
            case NAO_AUTENTICADO -> HttpStatus.UNAUTHORIZED;
        };
        return problema(status, e.codigo(), e.getMessage(), e.detalhes(), req);
    }

    @ExceptionHandler(PlanoComConflitoException.class)
    public ResponseEntity<RespostaDeErro> conflitoDePlano(PlanoComConflitoException e, HttpServletRequest req) {
        List<String> detalhes = e.conflitos().stream().map(c -> c.descricao()).toList();
        return problema(HttpStatus.CONFLICT, "plano_com_conflito", e.getMessage(), detalhes, req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RespostaDeErro> validacao(MethodArgumentNotValidException e, HttpServletRequest req) {
        List<String> detalhes = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage()).toList();
        return problema(HttpStatus.UNPROCESSABLE_ENTITY, "dados_invalidos", "Há campos inválidos na requisição.", detalhes, req);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestPartException.class})
    public ResponseEntity<RespostaDeErro> corpoIlegivel(Exception e, HttpServletRequest req) {
        return problema(HttpStatus.BAD_REQUEST, "requisicao_ilegivel", "Não foi possível ler a requisição enviada.", List.of(), req);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<RespostaDeErro> arquivoGrande(MaxUploadSizeExceededException e, HttpServletRequest req) {
        return problema(HttpStatus.PAYLOAD_TOO_LARGE, "arquivo_grande_demais", "O arquivo excede o tamanho máximo permitido (1 MB).", List.of(), req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<RespostaDeErro> naoEncontrado(NoResourceFoundException e, HttpServletRequest req) {
        return problema(HttpStatus.NOT_FOUND, "nao_encontrado", "Recurso não encontrado.", List.of(), req);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<RespostaDeErro> integridade(DataIntegrityViolationException e, HttpServletRequest req) {
        LOG.warn("Violação de integridade em {}: {}", req.getRequestURI(), e.getMostSpecificCause().getMessage());
        return problema(HttpStatus.CONFLICT, "violacao_de_integridade", "A operação conflita com dados já existentes.", List.of(), req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RespostaDeErro> inesperado(Exception e, HttpServletRequest req) throws Exception {
        if (e instanceof org.springframework.security.access.AccessDeniedException
                || e instanceof org.springframework.security.core.AuthenticationException) {
            throw e; // deixa o filtro de segurança responder (401/403 padronizados)
        }
        LOG.error("Erro inesperado em {}", req.getRequestURI(), e);
        return problema(HttpStatus.INTERNAL_SERVER_ERROR, "erro_interno", "Ocorreu um erro inesperado. Tente novamente em instantes.", List.of(), req);
    }

    private static ResponseEntity<RespostaDeErro> problema(HttpStatus status, String codigo, String detalhe, List<String> detalhes,
                                                           HttpServletRequest req) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(RespostaDeErro.de(status, codigo, detalhe, detalhes, req.getRequestURI()));
    }
}
