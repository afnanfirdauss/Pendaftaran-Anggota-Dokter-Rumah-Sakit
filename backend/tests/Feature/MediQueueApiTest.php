<?php

namespace Tests\Feature;

use App\Models\Dokter;
use App\Models\JadwalPraktik;
use App\Models\Pasien;
use App\Models\Poliklinik;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediQueueApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_health_check_endpoint(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)
            ->assertJson(['status' => 'ok', 'app' => 'MediQueue API']);
    }

    public function test_quick_demo_login(): void
    {
        $response = $this->postJson('/api/auth/quick-demo-login', [
            'role' => 'petugas',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email', 'role'],
                ],
            ]);
    }

    public function test_public_queue_display(): void
    {
        $response = $this->getJson('/api/antrean/public-display');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'today',
                'clinic_boards',
            ]);
    }

    public function test_patient_registration_with_auto_mrn(): void
    {
        $user = User::where('role', 'petugas')->first();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/pasiens', [
            'name' => 'Pasien Uji Coba Baru',
            'gender' => 'L',
            'birth_date' => '1995-05-15',
            'phone' => '081234567899',
            'address' => 'Jl. Uji Coba No. 1, Jakarta',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'medical_record_number',
                    'name',
                ],
            ]);

        $this->assertDatabaseHas('pasiens', [
            'name' => 'Pasien Uji Coba Baru',
        ]);
    }

    public function test_visit_registration_generates_queue_number(): void
    {
        $user = User::where('role', 'petugas')->first();
        $patient = Pasien::first();
        $clinic = Poliklinik::first();
        $schedule = JadwalPraktik::where('poliklinik_id', $clinic->id)->first();
        $doctor = Dokter::find($schedule->dokter_id);

        // Find upcoming date matching schedule's day_of_week
        $visitDate = now();
        while ((int) $visitDate->format('N') !== $schedule->day_of_week) {
            $visitDate->addDay();
        }
        $formattedDate = $visitDate->format('Y-m-d');

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/pendaftarans', [
            'patient_id' => $patient->id,
            'poliklinik_id' => $clinic->id,
            'dokter_id' => $doctor->id,
            'jadwal_praktik_id' => $schedule->id,
            'visit_date' => $formattedDate,
            'visit_type' => 'umum',
            'notes' => 'Keluhan batuk pilek 3 hari',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'queue_number',
                    'registration_number',
                    'status',
                ],
                'slip',
            ]);
    }
}
