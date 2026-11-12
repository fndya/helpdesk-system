import { Transform } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { TicketPriority } from '../common/enums/ticket-priority.enum.js';
import { TicketStatus } from '../common/enums/ticket-status.enum.js';

export class CreateTicketDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'The title field must be a string.' })
    @IsNotEmpty({ message: 'The title field is required.' })
    @MaxLength(255, {
        message: 'The title field must not be greater than 255 characters.',
    })
    title!: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'The description field must be a string.' })
    @IsNotEmpty({ message: 'The description field is required.' })
    description!: string;

    @IsEnum(TicketPriority, { message: 'The selected priority is invalid.' })
    priority!: TicketPriority;
}

export class ListTicketsDto {
    @Transform(({ value }) => (value === '' ? null : value))
    @ValidateIf((_object, value) => value !== null && value !== undefined)
    @IsEnum(TicketStatus, { message: 'The selected status is invalid.' })
    status?: TicketStatus | null;

    @Transform(({ value }) => (value === '' ? null : value))
    @ValidateIf((_object, value) => value !== null && value !== undefined)
    @IsEnum(TicketPriority, { message: 'The selected priority is invalid.' })
    priority?: TicketPriority | null;
}
