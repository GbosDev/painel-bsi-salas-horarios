package br.com.bussola.backend.domain.classsession;

import java.util.concurrent.atomic.AtomicLong;

public record ClassSessionId(Long value) {

    // Seeds from the wall clock (keeps ids roughly time-ordered, like the
    // legacy Date.now() ids) but a monotonic counter guarantees uniqueness
    // even when several ids are generated within the same millisecond —
    // System.currentTimeMillis() alone collided under fast test execution.
    private static final AtomicLong SEQUENCE = new AtomicLong(System.currentTimeMillis());

    public static ClassSessionId of(Long value) {
        return new ClassSessionId(value);
    }

    public static ClassSessionId generate() {
        return new ClassSessionId(SEQUENCE.incrementAndGet());
    }

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}