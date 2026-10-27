<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\Pendaftaran;
use App\Models\Poliklinik;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AntreanController extends Controller
{
    /**
     * Get queue list with comprehensive filters (today by default)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $date = $request->query('date', date('Y-m-d'));
        $clinicId = $request->query('poliklinik_id');
        $doctorId = $request->query('dokter_id');
        $status = $request->query('status');
        $search = $request->query('search');

        // If logged-in user is a doctor, default to their doctor_id
        if ($user && $user->isDokter() && !$doctorId) {
            $doctor = Dokter::where('user_id', $user->id)->first();
            if ($doctor) {
                $doctorId = $doctor->id;
            }
        }

        $query = Pendaftaran::with(['patient', 'dokter', 'poliklinik', 'jadwalPraktik'])
            ->whereDate('visit_date', $date);

        if ($clinicId) {
            $query->where('poliklinik_id', $clinicId);
        }

        if ($doctorId) {
            $query->where('dokter_id', $doctorId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('queue_number', 'LIKE', "%{$search}%")
                    ->orWhere('registration_number', 'LIKE', "%{$search}%")
                    ->orWhereHas('patient', function ($p) use ($search) {
                        $p->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('medical_record_number', 'LIKE', "%{$search}%");
                    });
            });
        }

        // Order: called first, in_progress second, waiting third, then completed, then cancelled
        $queues = $query->orderByRaw("
            CASE 
                WHEN status = 'called' THEN 1
                WHEN status = 'in_progress' THEN 2
                WHEN status = 'waiting' THEN 3
                WHEN status = 'completed' THEN 4
                WHEN status = 'cancelled' THEN 5
                ELSE 6
            END ASC
        ")
            ->orderBy('queue_sequence', 'asc')
            ->get();

        // Summary counts for tabs/badges
        $countsQuery = Pendaftaran::whereDate('visit_date', $date);
        if ($clinicId) {
            $countsQuery->where('poliklinik_id', $clinicId);
        }
        if ($doctorId) {
            $countsQuery->where('dokter_id', $doctorId);
        }

        $counts = [
            'all' => (clone $countsQuery)->count(),
            'waiting' => (clone $countsQuery)->where('status', 'waiting')->count(),
            'called' => (clone $countsQuery)->where('status', 'called')->count(),
            'in_progress' => (clone $countsQuery)->where('status', 'in_progress')->count(),
            'completed' => (clone $countsQuery)->where('status', 'completed')->count(),
            'cancelled' => (clone $countsQuery)->where('status', 'cancelled')->count(),
        ];

        return response()->json([
            'success' => true,
            'date' => $date,
            'counts' => $counts,
            'data' => $queues,
        ]);
    }

    /**
     * Call patient (changes status to 'called', sets called_at for TV announcement)
     */
    public function call(int $id): JsonResponse
    {
        $reg = Pendaftaran::with(['patient', 'dokter', 'poliklinik'])->find($id);

        if (!$reg) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendaftaran tidak ditemukan.',
            ], 404);
        }

        if ($reg->status === 'completed' || $reg->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => "Pasien tidak dapat dipanggil karena status saat ini adalah {$reg->status}.",
            ], 422);
        }

        $reg->status = 'called';
        $reg->called_at = now();
        $reg->save();

        return response()->json([
            'success' => true,
            'message' => "Nomor antrean {$reg->queue_number} berhasil dipanggil.",
            'data' => $reg,
        ]);
    }

    /**
     * Update queue status with strict lifecycle validation
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $reg = Pendaftaran::with(['patient', 'dokter', 'poliklinik'])->find($id);

        if (!$reg) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendaftaran tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:waiting,called,in_progress,completed,cancelled',
            'cancellation_reason' => 'required_if:status,cancelled|nullable|string|max:300',
        ]);

        $newStatus = $validated['status'];

        if (!$reg->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Transisi status dari '{$reg->status}' ke '{$newStatus}' tidak diperbolehkan.",
            ], 422);
        }

        $reg->status = $newStatus;

        if ($newStatus === 'called') {
            $reg->called_at = now();
        } elseif ($newStatus === 'in_progress') {
            $reg->started_at = now();
        } elseif ($newStatus === 'completed') {
            $reg->completed_at = now();
        } elseif ($newStatus === 'cancelled') {
            $reg->cancellation_reason = $validated['cancellation_reason'] ?? 'Dibatalkan oleh staf';
        }

        $reg->save();

        return response()->json([
            'success' => true,
            'message' => "Status antrean berhasil diubah menjadi {$newStatus}.",
            'data' => $reg,
        ]);
    }

    /**
     * Public Queue Display Feed (for waiting room TV screen)
     */
    public function publicDisplay(): JsonResponse
    {
        $today = date('Y-m-d');

        // Most recently called queue (within last 3 minutes or current in_progress)
        $recentlyCalled = Pendaftaran::with(['patient', 'dokter', 'poliklinik'])
            ->whereDate('visit_date', $today)
            ->where('status', 'called')
            ->orderBy('called_at', 'desc')
            ->first();

        // Status per clinic
        $clinics = Poliklinik::where('is_active', true)->get();
        $clinicBoards = [];

        foreach ($clinics as $clinic) {
            $serving = Pendaftaran::with(['patient', 'dokter'])
                ->where('poliklinik_id', $clinic->id)
                ->whereDate('visit_date', $today)
                ->whereIn('status', ['called', 'in_progress'])
                ->orderByRaw("CASE WHEN status = 'called' THEN 1 ELSE 2 END ASC")
                ->orderBy('called_at', 'desc')
                ->first();

            $waitingCount = Pendaftaran::where('poliklinik_id', $clinic->id)
                ->whereDate('visit_date', $today)
                ->where('status', 'waiting')
                ->count();

            $completedCount = Pendaftaran::where('poliklinik_id', $clinic->id)
                ->whereDate('visit_date', $today)
                ->where('status', 'completed')
                ->count();

            $clinicBoards[] = [
                'clinic_id' => $clinic->id,
                'clinic_name' => $clinic->name,
                'prefix' => $clinic->queue_prefix,
                'floor' => $clinic->floor ?? 'Lantai 1',
                'current_queue' => $serving ? $serving->queue_number : '-',
                'current_status' => $serving ? $serving->status : 'idle',
                'current_doctor' => $serving ? $serving->dokter->name : null,
                'current_patient_masked' => $serving ? $this->maskPatientName($serving->patient->name) : null,
                'waiting_count' => $waitingCount,
                'completed_count' => $completedCount,
            ];
        }

        return response()->json([
            'success' => true,
            'today' => Carbon::now()->translatedFormat('l, d F Y - H:i:s'),
            'recently_called' => $recentlyCalled ? [
                'id' => $recentlyCalled->id,
                'queue_number' => $recentlyCalled->queue_number,
                'patient_name' => $this->maskPatientName($recentlyCalled->patient->name),
                'poliklinik_name' => $recentlyCalled->poliklinik->name,
                'poliklinik_floor' => $recentlyCalled->poliklinik->floor ?? 'Lantai 1',
                'dokter_name' => $recentlyCalled->dokter->name,
                'called_at' => $recentlyCalled->called_at?->format('H:i:s'),
                'called_at_timestamp' => $recentlyCalled->called_at?->timestamp,
            ] : null,
            'clinic_boards' => $clinicBoards,
        ]);
    }

    /**
     * Helper to mask patient name for public display privacy (e.g. Joko Widodo -> Joko W***)
     */
    private function maskPatientName(string $name): string
    {
        $parts = explode(' ', trim($name));
        if (count($parts) === 1) {
            return $parts[0];
        }
        $firstName = $parts[0];
        $rest = array_slice($parts, 1);
        $maskedRest = array_map(function ($part) {
            return mb_substr($part, 0, 1) . '***';
        }, $rest);

        return $firstName . ' ' . implode(' ', $maskedRest);
    }
}
