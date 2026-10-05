package br.com.bussola.backend.domain.shared;

public class NotFoundException extends DomainException {
    public NotFoundException(String entity, Object id) {
        super(entity + " não encontrado(a): " + id);
    }
}
