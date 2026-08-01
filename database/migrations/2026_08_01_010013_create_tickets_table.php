<?php

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         Schema::create('tickets', function (Blueprint $table) {

            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('status')
                ->default(TicketStatus::OPEN->value);
            $table->string('priority')
                ->default(TicketPriority::MEDIUM->value);
            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();
            $table->timestamps();
            $table->index('status');
            $table->index('priority');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
