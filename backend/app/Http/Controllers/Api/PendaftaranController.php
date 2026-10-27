<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\JadwalPraktik;
use App\Models\Pasien;
use App\Models\Pendaftaran;
use App\Models\Poliklinik;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PendaftaranController extends Controller
{
    /**
     * Store new visit registration with transactional quota and queue sequence locking
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:pasiens,id',
            'poliklinik_id' => 'required|exists:polikliniks,id',
            'dokter_id' => 'required|exists:dokters,id',
            'jadwal_praktik_id' => 'required|exists:jadwal_praktiks,id',
            'visit_date' => 'required|date|after_or_equal:today',
            'visit_type' => 'required|in:umum,kontrol',
            'notes' => 'nullable|string|max:500',
        ]);

        $userId = $request->user()?->id;

        // Perform transactional creation with strict database locks
        $registration = DB::transaction(function () use ($validated, $userId) {
            // 1. Lock and verify schedule
            $schedule = JadwalPraktik::where('id', $validated['jadwal_praktik_id'])
                ->lockForUpdate()
                ->first();

            if (!$schedule || !$schedule->is_active) {
                throw ValidationException::withMessages([
                    'jadwal_praktik_id' => ['Jadwal praktik dokter sedang tidak aktif atau tidak ditemukan.'],
                ]);
            }

            // 2. Verify doctor matches clinic
            $doctor = Dokter::find($validated['dokter_id']);
            if (!$doctor || $doctor->poliklinik_id !== (int) $validated['poliklinik_id']) {
                throw ValidationException::withMessages([
                    'dokter_id' => ['Dokter yang dipilih tidak bertugas di poliklinik tersebut.'],
                ]);
            }

            // 3. Verify day of week matches visit date
            $visitDate = Carbon::parse($validated['visit_date']);
            $dayOfWeek = (int) $visitDate->format('N');
            if ($schedule->day_of_week !== $dayOfWeek) {
                throw ValidationException::withMessages([
                    'visit_date' => ["Jadwal dokter ini hanya melayani pada hari {$schedule->day_name}."],
                ]);
            }

            // 4. Duplicate check: patient cannot register twice on same date & doctor (unless previous was cancelled)
            $existing = Pendaftaran::where('patient_id', $validated['patient_id'])
                ->where('dokter_id', $validated['dokter_id'])
                ->whereDate('visit_date', $validated['visit_date'])
                ->where('status', '!=', 'cancelled')
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'patient_id' => ["Pasien sudah terdaftar pada dokter dan tanggal yang sama dengan nomor antrean {$existing->queue_number}."],
                ]);
            }

            // 5. Quota check with lock
            $bookedCount = Pendaftaran::where('jadwal_praktik_id', $schedule->id)
                ->whereDate('visit_date', $validated['visit_date'])
                ->where('status', '!=', 'cancelled')
                ->lockForUpdate()
                ->count();

            if ($bookedCount >= $schedule->quota) {
                throw ValidationException::withMessages([
                    'jadwal_praktik_id' => ["Kuota pendaftaran untuk jadwal dokter ini sudah penuh ({$bookedCount}/{$schedule->quota}). Silakan pilih dokter atau tanggal lain."],
                ]);
            }

            // 6. Generate sequential daily queue number per clinic (e.g. A-001)
            $clinic = Poliklinik::find($validated['poliklinik_id']);
            $prefix = $clinic ? $clinic->queue_prefix : 'A';

            // Get max sequence today for this clinic
            $maxSeq = (int) Pendaftaran::where('poliklinik_id', $validated['poliklinik_id'])
                ->whereDate('visit_date', $validated['visit_date'])
                ->lockForUpdate()
                ->max('queue_sequence');

            $nextSeq = $maxSeq + 1;
            $queueNumber = sprintf("%s-%03d", $prefix, $nextSeq);

            // Generate unique registration code: REG-YYYYMMDD-XXXX
            $dateClean = str_replace('-', '', $validated['visit_date']);
            $totalRegToday = (int) Pendaftaran::whereDate('visit_date', $validated['visit_date'])
                ->lockForUpdate()
                ->count();
            $regNumber = sprintf("REG-%s-%04d", $dateClean, $totalRegToday + 1);

            // 7. Create registration record
            return Pendaftaran::create([
                'registration_number' => $regNumber,
                'queue_number' => $queueNumber,
                'queue_sequence' => $nextSeq,
                'patient_id' => $validated['patient_id'],
                'dokter_id' => $validated['dokter_id'],
                'poliklinik_id' => $validated['poliklinik_id'],
                'jadwal_praktik_id' => $validated['jadwal_praktik_id'],
                'visit_date' => $validated['visit_date'],
                'visit_type' => $validated['visit_type'],
                'status' => 'waiting',
                'notes' => $validated['notes'] ?? null,
                'registered_by_user_id' => $userId,
            ]);
        });

        $registration->load(['patient', 'dokter', 'poliklinik', 'jadwalPraktik', 'registeredBy']);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran kunjungan berhasil dibuat.',
            'data' => $registration,
            'slip' => $this->formatSlipPayload($registration),
        ], 201);
    }

    /**
     * Show registration details
     */
    public function show(int $id): JsonResponse
    {
        $registration = Pendaftaran::with(['patient', 'dokter', 'poliklinik', 'jadwalPraktik', 'registeredBy'])
            ->find($id);

        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $registration,
            'slip' => $this->formatSlipPayload($registration),
        ]);
    }

    /**
     * Get dedicated thermal slip payload ready for printing
     */
    public function slip(int $id): JsonResponse
    {
        $registration = Pendaftaran::with(['patient', 'dokter', 'poliklinik', 'jadwalPraktik', 'registeredBy'])
            ->find($id);

        if (!$registration) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatSlipPayload($registration),
        ]);
    }

    /**
     * Helper to prepare slip printable structure
     */
    private function formatSlipPayload(Pendaftaran $reg): array
    {
        return [
            'hospital_name' => 'RS MEDIQUEUE UTAMA',
            'hospital_address' => 'Jl. Kesehatan No. 108, Jakarta Selatan — Telp: (021) 765-4321',
            'registration_number' => $reg->registration_number,
            'queue_number' => $reg->queue_number,
            'queue_sequence' => $reg->queue_sequence,
            'patient_mrn' => $reg->patient->medical_record_number,
            'patient_name' => $reg->patient->name,
            'patient_gender' => $reg->patient->gender === 'L' ? 'Laki-laki' : 'Perempuan',
            'poliklinik_name' => $reg->poliklinik->name,
            'poliklinik_floor' => $reg->poliklinik->floor ?? 'Lantai 1',
            'dokter_name' => $reg->dokter->name,
            'visit_date' => Carbon::parse($reg->visit_date)->translatedFormat('l, d F Y'),
            'schedule_time' => sprintf('%s - %s WIB', substr($reg->jadwalPraktik->start_time, 0, 5), substr($reg->jadwalPraktik->end_time, 0, 5)),
            'visit_type' => strtoupper($reg->visit_type),
            'status' => strtoupper($reg->status),
            'registered_at' => $reg->created_at->translatedFormat('d/m/Y H:i'),
            'registered_by' => $reg->registeredBy?->name ?? 'Petugas Loket',
            'arrival_instructions' => [
                '1. Harap hadir 15 menit sebelum estimasi jam praktik dimulai.',
                '2. Duduk tertib di ruang tunggu poliklinik dan perhatikan layar monitor antrean.',
                '3. Siapkan kartu identitas/BPJS dan tunjukkan karcis ini saat nomor Anda dipanggil.',
                '4. Bila terlewat 3 kali panggilan, silakan konfirmasi ke perawat poli.',
            ],
        ];
    }
}
