import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString({ message: 'The name field must be a string.' })
    @MinLength(2, { message: 'The name field must be at least 2 characters.' })
    @MaxLength(255, {
        message: 'The name field must not be greater than 255 characters.',
    })
    name!: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsEmail({}, { message: 'The email field must be a valid email address.' })
    @MinLength(2, { message: 'The email field must be at least 2 characters.' })
    @MaxLength(255, {
        message: 'The email field must not be greater than 255 characters.',
    })
    email!: string;

    @IsString({ message: 'The password field must be a string.' })
    @IsNotEmpty({ message: 'The password field is required.' })
    @MinLength(8, {
        message: 'The password field must be at least 8 characters.',
    })
    password!: string;
}

export class LoginDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsEmail({}, { message: 'The email field must be a valid email address.' })
    email!: string;

    @IsString({ message: 'The password field must be a string.' })
    @IsNotEmpty({ message: 'The password field is required.' })
    password!: string;
}

export class RefreshDto {
    @IsString()
    @MinLength(32)
    refresh_token!: string;
}
