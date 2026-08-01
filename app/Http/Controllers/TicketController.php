<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\Ticket\TicketService;
use Illuminate\Http\JsonResponse;

class TicketController extends Controller
{
    public function store(
        CreateTicketRequest $request,
        TicketService $service
    ): JsonResponse
    {
        $this->authorize('create', Ticket::class);

        $ticket = $service->createTicket(
            $request->user(),
            $request->validated(),
        );

        return (new TicketResource($ticket))
            ->response()
            ->setStatusCode(201);
    }
}