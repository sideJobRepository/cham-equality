package com.chamapi.common.util;

import java.util.function.Function;

public final class NullSafe {

    private NullSafe() {
    }

    public static <T, R> R mapOrNull(T source, Function<T, R> mapper) {
        return source != null ? mapper.apply(source) : null;
    }
}
