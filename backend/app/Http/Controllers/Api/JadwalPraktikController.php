<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\JadwalPraktik;
use App\Models\Pendaftaran;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JadwalPraktikController extends Controller
{
    /**
     * List all practice schedules with doctor and clinic details
     */
    public function index(Request $request): JsonResponse
    {
        $doctorId = $request->query('dokter_id');
        $clinicId = $request->query('poliklinik_id');
        $activeOnly = $request->boolean('active_only');

        $query = JadwalPraktik::with(['dokter', 'poliklinik']);

        if ($doctorId) {
            $query->where('dokter_id', $doctorId);
        }

        if ($clinicId) {
            $query->where('poliklinik_id', $clinicId);
        }

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        $schedules = $query->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Get available doctor schedules for a specific clinic and visit date with quota calculation
     */
    public function available(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'poliklinik_id' => 'required|exists:polikliniks,id',
            'visit_date' => 'required|date|after_or_equal:today',
        ]);

        $date = Carbon::parse($validated['visit_date']);
        $dayOfWeek = (int) $date->format('N'); // 1 (Senin) - 7 (Minggu)

        $schedules = JadwalPraktik::with(['dokter'])
            ->where('poliklinik_id', $validated['poliklinik_id'])
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->whereHas('dokter', function ($q) {
                $q->where('is_active', true);
            })
            ->get()
            ->map(function ($schedule) use ($validated) {
                $bookedCount = Pendaftaran::where('jadwal_praktik_id', $schedule->id)
                    ->whereDate('visit_date', $validated['visit_date'])
                    ->where('status', '!=', 'cancelled')
                    ->count();

                $remainingQuota = max(0, $schedule->quota - $bookedCount);

                return [
                    'id' => $schedule->id,
                    'dokter_id' => $schedule->dokter_id,
                    'dokter_name' => $schedule->dokter->name,
                    'specialization' => $schedule->dokter->specialization,
                    'day_of_week' => $schedule->day_of_week,
                    'day_name' => $schedule->day_name,
                    'start_time' => substr($schedule->start_time, 0, 5),
                    'end_time' => substr($schedule->end_time, 0, 5),
                    'quota' => $schedule->quota,
                    'booked_count' => $bookedCount,
                    'remaining_quota' => $remainingQuota,
                    'is_full' => $remainingQuota <= 0,
                ];
            });

        return response()->json([
            'success' => true,
            'day_name' => $schedules->first()['day_name'] ?? $this->getDayName($dayOfWeek),
            'data' => $schedules,
        ]);
    }

    /**
     * Store new practice schedule with overlap check
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dokter_id' => 'required|exists:dokters,id',
            'poliklinik_id' => 'required|exists:polikliniks,id',
            'day_of_week' => 'required|integer|between:1,7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'quota' => 'required|integer|min:1|max:200',
            'is_active' => 'boolean',
        ]);

        // Check for doctor schedule clash on the same day
        $overlap = JadwalPraktik::where('dokter_id', $validated['dokter_id'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where('is_active', true)
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhere(function ($sub) use ($validated) {
                        $sub->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                    });
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal bertabrakan dengan jadwal aktif dokter yang lain pada hari yang sama.',
            ], 422);
        }

        $validated['day_name'] = $this->getDayName($validated['day_of_week']);
        $schedule = JadwalPraktik::create($validated);
        $schedule->load(['dokter', 'poliklinik']);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal praktik berhasil ditambahkan.',
            'data' => $schedule,
        ], 201);
    }

    /**
     * Update practice schedule
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $schedule = JadwalPraktik::find($id);

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'dokter_id' => 'required|exists:dokters,id',
            'poliklinik_id' => 'required|exists:polikliniks,id',
            'day_of_week' => 'required|integer|between:1,7',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'quota' => 'required|integer|min:1|max:200',
            'is_active' => 'boolean',
        ]);

        // Check clash excluding this schedule
        $overlap = JadwalPraktik::where('dokter_id', $validated['dokter_id'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where('id', '!=', $id)
            ->where('is_active', true)
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']]);
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal bertabrakan dengan jadwal aktif dokter yang lain.',
            ], 422);
        }

        $validated['day_name'] = $this->getDayName($validated['day_of_week']);
        $schedule->update($validated);
        $schedule->load(['dokter', 'poliklinik']);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal praktik berhasil diperbarui.',
            'data' => $schedule,
        ]);
    }

    /**
     * Delete practice schedule
     */
    public function destroy(int $id): JsonResponse
    {
        $schedule = JadwalPraktik::find($id);

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan.',
            ], 404);
        }

        // Check if there are active registrations for future dates
        $hasFuture = $schedule->pendaftarans()
            ->where('visit_date', '>=', date('Y-m-d'))
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($hasFuture) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak dapat dihapus karena masih memiliki pendaftaran aktif mendatang. Nonaktifkan saja jadwal ini.',
            ], 422);
        }

        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal praktik berhasil dihapus.',
        ]);
    }

    private function getDayName(int $day): string
    {
        $names = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];

        return $names[$day] ?? 'Senin';
    }
}
