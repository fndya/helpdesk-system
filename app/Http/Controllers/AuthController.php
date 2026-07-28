<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Services\Auth\RegistrationService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        private readonly RegistrationService $registrationService,
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->registrationService->register(
            $request->validated()
        );

        return response()->json($user, 201);
    }
}