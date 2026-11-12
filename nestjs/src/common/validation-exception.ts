import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function validationException(errors: ValidationError[]) {
    const fields = Object.fromEntries(
        errors.map((error) => {
            const missing =
                error.value === undefined ||
                error.value === null ||
                error.value === '';
            return [
                error.property,
                missing
                    ? [`The ${error.property} field is required.`]
                    : Object.values(error.constraints ?? {}),
            ];
        }),
    );
    return new UnprocessableEntityException({
        message: 'The given data was invalid.',
        errors: fields,
    });
}
