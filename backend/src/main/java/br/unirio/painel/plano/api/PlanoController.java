package br.unirio.painel.plano.api;

import br.unirio.painel.configuracao.UsuarioAutenticado;
import br.unirio.painel.plano.aplicacao.RepositorioDePlanos.PlanoSalvo;
import br.unirio.painel.plano.aplicacao.ServicoDePlano;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** "Meu plano": exclusivo do perfil ALUNO, sempre do próprio usuário autenticado. */
@RestController
@RequestMapping("/api/v1/cursos/{codigo}/plano")
@PreAuthorize("hasRole('ALUNO')")
public class PlanoController {

    public record PlanoRequisicao(@NotNull @Size(max = 100) List<Long> turmaIds) { }

    public record PlanoDto(List<Long> turmaIds, Instant atualizadoEm) {
        static PlanoDto de(PlanoSalvo p) { return new PlanoDto(p.turmaIds(), p.atualizadoEm()); }
    }

    private final ServicoDePlano servico;

    public PlanoController(ServicoDePlano servico) {
        this.servico = servico;
    }

    @GetMapping
    public PlanoDto obter(@PathVariable String codigo, @AuthenticationPrincipal UsuarioAutenticado u) {
        return PlanoDto.de(servico.obter(u.id(), codigo));
    }

    @PutMapping
    public PlanoDto salvar(@PathVariable String codigo, @Valid @RequestBody PlanoRequisicao req, @AuthenticationPrincipal UsuarioAutenticado u) {
        return PlanoDto.de(servico.salvar(u.id(), codigo, req.turmaIds()));
    }
}
