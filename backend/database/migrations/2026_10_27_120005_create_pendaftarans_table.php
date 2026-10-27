<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftarans', function (Blueprint $table) {
            $table->id();
            $table->string('registration_number', 35)->unique();
            $table->string('queue_number', 20);
            $table->integer('queue_sequence');
            $table->foreignId('patient_id')->constrained('pasiens')->cascadeOnDelete();
            $table->foreignId('dokter_id')->constrained('dokters')->cascadeOnDelete();
            $table->foreignId('poliklinik_id')->constrained('polikliniks')->cascadeOnDelete();
            $table->foreignId('jadwal_praktik_id')->constrained('jadwal_praktiks')->cascadeOnDelete();
            $table->date('visit_date');
            $table->enum('visit_type', ['umum', 'kontrol'])->default('umum');
            $table->enum('status', ['waiting', 'called', 'in_progress', 'completed', 'cancelled'])->default('waiting');
            $table->timestamp('called_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('registered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes for fast lookups and reporting
            $table->index(['visit_date', 'status']);
            $table->index(['poliklinik_id', 'visit_date']);
            $table->index(['dokter_id', 'visit_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftarans');
    }
};
