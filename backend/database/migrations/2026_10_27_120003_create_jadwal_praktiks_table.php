<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal_praktiks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dokter_id')->constrained('dokters')->cascadeOnDelete();
            $table->foreignId('poliklinik_id')->constrained('polikliniks')->cascadeOnDelete();
            $table->tinyInteger('day_of_week'); // 1 = Senin, ..., 7 = Minggu
            $table->string('day_name', 20); // Senin, Selasa, dll
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('quota')->default(20);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_praktiks');
    }
};
