<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pasiens', function (Blueprint $table) {
            $table->id();
            $table->string('medical_record_number', 25)->unique();
            $table->string('nik', 20)->nullable()->unique();
            $table->string('name');
            $table->enum('gender', ['L', 'P']);
            $table->date('birth_date');
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->timestamp('first_registered_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pasiens');
    }
};
