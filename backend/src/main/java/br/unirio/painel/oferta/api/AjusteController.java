package br.unirio.painel.oferta.api;

import br.unirio.painel.configuracao.UsuarioAutenticado;
import br.unirio.painel.oferta.api.Dtos.HorarioRequisicao;
import br.unirio.painel.oferta.api.Dtos.TurmaDto;
import br.unirio.painel.oferta.aplicacao.AjusteExcepcional;
import br.unirio.painel.oferta.aplicacao.AjusteExcepcional.DadosDeAjuste;
import br.unirio.painel.oferta.aplicacao.AjusteExcepcional.DadosDeNovaTurma;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Ajuste excepcional de turmas (somente PROFESSOR); todo ajuste exige motivo e vira registro de auditoria. */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('PROFESSOR')")
public class AjusteController {

    public record EdicaoRequisicao(@Size(max = 200) String professor, @Size(max = 60) String sala,
                                   @Min(0) @Max(1000) int vagas, @Valid List<HorarioRequisicao> horarios,
                                   Integer versao, @NotBlank @Size(max = 500) String motivo) { }

    public record NovaTurmaRequisicao(@NotBlank @Size(max = 60) String sigla, @NotBlank @Size(max = 250) String disciplina,
                                      @Size(max = 30) String codigo, @Size(max = 5) String periodo,
                                      @Size(max = 200) String professor, @Size(max = 60) String sala,
                                      @Min(0) @Max(1000) int vagas, @Valid List<HorarioRequisicao> horarios,
                                      @NotBlank @Size(max = 500) String motivo) { }

    public record ExclusaoRequisicao(@NotBlank @Size(max = 500) String motivo) { }

    public record ResultadoDto(TurmaDto turma, List<String> avisos) { }

    private final AjusteExcepcional ajuste;

    public AjusteController(AjusteExcepcional ajuste) {
        this.ajuste = ajuste;
    }

    @PutMapping("/turmas/{id}")
    public ResultadoDto editar(@PathVariable long id, @Valid @RequestBody EdicaoRequisicao req, @AuthenticationPrincipal UsuarioAutenticado u) {
        var r = ajuste.editar(id, new DadosDeAjuste(req.professor(), req.sala(), req.vagas(), Dtos.horarios(req.horarios()), req.versao()),
                req.motivo(), u.comoAutor());
        return new ResultadoDto(TurmaDto.de(r.turma()), r.avisos());
    }

    @PostMapping("/cursos/{codigo}/turmas")
    @ResponseStatus(HttpStatus.CREATED)
    public ResultadoDto criar(@PathVariable String codigo, @Valid @RequestBody NovaTurmaRequisicao req, @AuthenticationPrincipal UsuarioAutenticado u) {
        var r = ajuste.criar(codigo, new DadosDeNovaTurma(req.sigla(), req.disciplina(), req.codigo(), req.periodo(),
                req.professor(), req.sala(), req.vagas(), Dtos.horarios(req.horarios())), req.motivo(), u.comoAutor());
        return new ResultadoDto(TurmaDto.de(r.turma()), r.avisos());
    }

    @PostMapping("/turmas/{id}/exclusao")
    public ResponseEntity<Void> excluir(@PathVariable long id, @Valid @RequestBody ExclusaoRequisicao req, @AuthenticationPrincipal UsuarioAutenticado u) {
        ajuste.excluir(id, req.motivo(), u.comoAutor());
        return ResponseEntity.noContent().build();
    }
}
