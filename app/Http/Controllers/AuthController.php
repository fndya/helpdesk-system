<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\Auth\AuthenticationService;
use App\Services\Auth\RegistrationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        private readonly RegistrationService $registrationService,
        private readonly AuthenticationService $authenticationService,
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->registrationService->register(
            $request->validated()
        );

        return response()->json($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authenticationService->login(
            $request->validated()
        );

        return response()->json($result);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $this->authenticationService->logout($user);


        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }
}