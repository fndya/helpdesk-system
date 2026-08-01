<?php

namespace App\Services\Ticket;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

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
}