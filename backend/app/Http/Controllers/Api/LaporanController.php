<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\Pendaftaran;
use App\Models\Poliklinik;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    /**
     * Get aggregate report data by date range
     */
    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', Carbon::now()->subDays(29)->format('Y-m-d'));
        $endDate = $request->query('end_date', date('Y-m-d'));
        $clinicId = $request->query('poliklinik_id');

        $baseQuery = Pendaftaran::whereBetween('visit_date', [$startDate, $endDate]);

        if ($clinicId) {
            $baseQuery->where('poliklinik_id', $clinicId);
        }

        // Summary counts
        $total = (clone $baseQuery)->count();
        $completed = (clone $baseQuery)->where('status', 'completed')->count();
        $cancelled = (clone $baseQuery)->where('status', 'cancelled')->count();
        $active = (clone $baseQuery)->whereIn('status', ['waiting', 'called', 'in_progress'])->count();

        // Clinic Breakdown
        $clinicBreakdown = Pendaftaran::join('polikliniks', 'pendaftarans.poliklinik_id', '=', 'polikliniks.id')
            ->whereBetween('pendaftarans.visit_date', [$startDate, $endDate])
            ->select(
                'polikliniks.id',
                'polikliniks.name as clinic_name',
                'polikliniks.queue_prefix',
                DB::raw('COUNT(pendaftarans.id) as total_visits'),
                DB::raw("SUM(CASE WHEN pendaftarans.status = 'completed' THEN 1 ELSE 0 END) as completed_visits"),
                DB::raw("SUM(CASE WHEN pendaftarans.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_visits")
            )
            ->groupBy('polikliniks.id', 'polikliniks.name', 'polikliniks.queue_prefix')
            ->orderBy('total_visits', 'desc')
            ->get();

        // Doctor Productivity Breakdown
        $doctorBreakdown = Pendaftaran::join('dokters', 'pendaftarans.dokter_id', '=', 'dokters.id')
            ->join('polikliniks', 'dokters.poliklinik_id', '=', 'polikliniks.id')
            ->whereBetween('pendaftarans.visit_date', [$startDate, $endDate])
            ->select(
                'dokters.id',
                'dokters.name as doctor_name',
                'dokters.specialization',
                'polikliniks.name as clinic_name',
                DB::raw('COUNT(pendaftarans.id) as total_patients'),
                DB::raw("SUM(CASE WHEN pendaftarans.status = 'completed' THEN 1 ELSE 0 END) as completed_patients"),
                DB::raw("SUM(CASE WHEN pendaftarans.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_patients")
            )
            ->groupBy('dokters.id', 'dokters.name', 'dokters.specialization', 'polikliniks.name')
            ->orderBy('total_patients', 'desc')
            ->get();

        // Daily Trend within the range
        $dailyTrend = Pendaftaran::whereBetween('visit_date', [$startDate, $endDate])
            ->select(
                'visit_date',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            )
            ->groupBy('visit_date')
            ->orderBy('visit_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_registrations' => $total,
                'completed_visits' => $completed,
                'cancelled_visits' => $cancelled,
                'active_visits' => $active,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
            ],
            'clinic_breakdown' => $clinicBreakdown,
            'doctor_breakdown' => $doctorBreakdown,
            'daily_trend' => $dailyTrend,
        ]);
    }

    /**
     * Export registration records as CSV file download
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $startDate = $request->query('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->query('end_date', date('Y-m-d'));

        $records = Pendaftaran::with(['patient', 'dokter', 'poliklinik'])
            ->whereBetween('visit_date', [$startDate, $endDate])
            ->orderBy('visit_date', 'asc')
            ->orderBy('queue_sequence', 'asc')
            ->get();

        $filename = "laporan_kunjungan_mediqueue_{$startDate}_sampai_{$endDate}.csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($records) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            // CSV Header
            fputcsv($handle, [
                'No. Registrasi',
                'No. Antrean',
                'Tanggal Kunjungan',
                'No. Rekam Medis',
                'Nama Pasien',
                'Jenis Kelamin',
                'Poliklinik',
                'Dokter',
                'Jenis Kunjungan',
                'Status',
                'Catatan / Alasan Batal',
            ]);

            foreach ($records as $r) {
                fputcsv($handle, [
                    $r->registration_number,
                    $r->queue_number,
                    $r->visit_date,
                    $r->patient->medical_record_number,
                    $r->patient->name,
                    $r->patient->gender === 'L' ? 'Laki-laki' : 'Perempuan',
                    $r->poliklinik->name,
                    $r->dokter->name,
                    ucfirst($r->visit_type),
                    ucfirst($r->status),
                    $r->cancellation_reason ?: $r->notes,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
