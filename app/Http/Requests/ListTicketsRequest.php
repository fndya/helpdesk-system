<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    
    public function rules(): array
    {
        return [
            'status' => [
                'nullable',
                Rule::enum(TicketStatus::class),
            ],
        
            'priority' => [
                'nullable',
                Rule::enum(TicketPriority::class),
            ],
        ];
    }
}
