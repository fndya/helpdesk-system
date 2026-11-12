export function serializeDate(value: Date | null): string | null {
    return (
        value
            ?.toISOString()
            .replace(/\.(\d{3})Z$/, (_match, ms: string) => `.${ms}000Z`) ??
        null
    );
}
