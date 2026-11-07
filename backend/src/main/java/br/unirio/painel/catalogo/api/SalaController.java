package br.unirio.painel.catalogo.api;

import br.unirio.painel.catalogo.aplicacao.ServicoDeSalas;
import br.unirio.painel.configuracao.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cursos/{codigo}/salas")
@PreAuthorize("hasRole('PROFESSOR')")
public class SalaController {

    public record NovaSalaRequisicao(@NotBlank @Size(max = 60) String nome) { }

    private final ServicoDeSalas salas;

    public SalaController(ServicoDeSalas salas) {
        this.salas = salas;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void adicionar(@PathVariable String codigo, @Valid @RequestBody NovaSalaRequisicao req, @AuthenticationPrincipal UsuarioAutenticado u) {
        salas.adicionar(codigo, req.nome(), u.comoAutor());
    }

    @DeleteMapping("/{salaId}")
    public ResponseEntity<Void> remover(@PathVariable String codigo, @PathVariable long salaId, @AuthenticationPrincipal UsuarioAutenticado u) {
        salas.remover(codigo, salaId, u.comoAutor());
        return ResponseEntity.noContent().build();
    }
}
