<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthenticationService
{
    public function login(array $credentials): array
    {
        if (! Auth::attempt($credentials)) {
            throw new UnauthorizedHttpException('', 'Invalid credentials.');
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ];
    }
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}