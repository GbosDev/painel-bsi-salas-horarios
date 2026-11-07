package br.unirio.painel.oferta.api;

import br.unirio.painel.catalogo.aplicacao.ConsultaDeCatalogo;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.oferta.api.Dtos.CursoDto;
import br.unirio.painel.oferta.api.Dtos.SalaDto;
import br.unirio.painel.oferta.api.Dtos.TurmaDto;
import br.unirio.painel.oferta.aplicacao.ConsultaDePainel;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PainelController {

    public record PainelDto(CursoDto curso, String periodoLetivo, List<SalaDto> salas, List<TurmaDto> turmas) { }

    public record EmentaDto(String codigo, String nome, String texto, String fonte) { }

    private final ConsultaDeCatalogo catalogo;
    private final ConsultaDePainel painel;

    public PainelController(ConsultaDeCatalogo catalogo, ConsultaDePainel painel) {
        this.catalogo = catalogo;
        this.painel = painel;
    }

    @GetMapping("/cursos")
    public List<CursoDto> cursos() {
        return catalogo.cursos().stream().map(CursoDto::de).toList();
    }

    @GetMapping("/cursos/{codigo}/painel")
    public PainelDto painel(@PathVariable String codigo) {
        var p = painel.painel(codigo);
        return new PainelDto(CursoDto.de(p.curso()), p.periodoLetivo(),
                p.salas().stream().map(SalaDto::de).toList(), p.turmas().stream().map(TurmaDto::de).toList());
    }

    @GetMapping("/turmas/{id}/ementa")
    public EmentaDto ementa(@PathVariable long id) {
        return painel.ementaDaTurma(id)
                .map(e -> new EmentaDto(e.codigo(), e.nome(), e.texto(), e.fonte()))
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("ementa_nao_encontrada", "Ementa não disponível para esta disciplina."));
    }
}
