package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import java.time.Instant;
import java.util.List;

/** Uniform error shape returned by every endpoint in this API. */
public record ApiError(Instant timestamp, int status, String error, String message, String path,
                         List<FieldErrorDto> fieldErrors) {

    public record FieldErrorDto(String field, String message) {}

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, List.of());
    }

    public static ApiError withFieldErrors(int status, String error, String message, String path,
                                              List<FieldErrorDto> fieldErrors) {
        return new ApiError(Instant.now(), status, error, message, path, fieldErrors);
    }
}
