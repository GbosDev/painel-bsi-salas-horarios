package br.com.bussola.backend.domain.shared;

/**
 * Base type for every rule violation raised inside the domain layer.
 * Infrastructure never throws this directly; it is translated by the
 * inbound adapters (see GlobalExceptionHandler) into an HTTP response.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
