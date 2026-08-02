<?php

namespace App\Services\Ticket;
use App\Enums\UserRole;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TicketService
{
    public function createTicket(User $user, array $data): Ticket
    {
        return $user->tickets()->create([
            'title' => $data['title'],
            'description' => $data['description'],
            'priority' => $data['priority'],

            'status' => TicketStatus::OPEN,
        ]);
    }

    public function getTickets(User $user, array $filters): LengthAwarePaginator
    {
        $query = Ticket::query();

        if ($user->role === UserRole::USER) {
            $query->where('user_id', $user->id);
        }

        $query
        ->when(
            $filters['status'] ?? null,
            fn ($query, $status) => $query->where('status', $status)
        )
        ->when(
            $filters['priority'] ?? null,
            fn ($query, $priority) => $query->where('priority', $priority)
        );
        return $query
            ->latest()
            ->paginate(15);
    }
}