<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\Pasien;
use App\Models\Pendaftaran;
use App\Models\Poliklinik;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get aggregate metrics, charts, and recent registrations
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = date('Y-m-d');

        // Scoping for Doctor role
        $doctorId = null;
        if ($user && $user->isDokter()) {
            $doctor = Dokter::where('user_id', $user->id)->first();
            if ($doctor) {
                $doctorId = $doctor->id;
            }
        }

        // 1. Core Summary Metrics
        $totalPatients = Pasien::count();

        $todayRegQuery = Pendaftaran::whereDate('visit_date', $today);
        if ($doctorId) {
            $todayRegQuery->where('dokter_id', $doctorId);
        }
        $todayRegistrations = (clone $todayRegQuery)->count();
        $waitingCount = (clone $todayRegQuery)->whereIn('status', ['waiting', 'called'])->count();
        $inProgressCount = (clone $todayRegQuery)->where('status', 'in_progress')->count();
        $completedCount = (clone $todayRegQuery)->where('status', 'completed')->count();
        $cancelledCount = (clone $todayRegQuery)->where('status', 'cancelled')->count();

        // 2. 14-30 Days Visit Trend for Recharts Area/Bar Chart
        $daysRange = 14;
        $startDate = Carbon::now()->subDays($daysRange - 1)->format('Y-m-d');

        $trendQuery = Pendaftaran::whereBetween('visit_date', [$startDate, $today]);
        if ($doctorId) {
            $trendQuery->where('dokter_id', $doctorId);
        }

        $trendData = $trendQuery->select(
            'visit_date',
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
            DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled"),
            DB::raw("SUM(CASE WHEN status IN ('waiting', 'called', 'in_progress') THEN 1 ELSE 0 END) as active")
        )
            ->groupBy('visit_date')
            ->orderBy('visit_date', 'asc')
            ->get()
            ->keyBy(fn ($item) => Carbon::parse($item->visit_date)->format('Y-m-d'));

        // Fill gap days so chart is continuous
        $chartTrend = [];
        for ($i = $daysRange - 1; $i >= 0; $i--) {
            $d = Carbon::now()->subDays($i)->format('Y-m-d');
            $dayLabel = Carbon::parse($d)->translatedFormat('d M');
            if (isset($trendData[$d])) {
                $item = $trendData[$d];
                $chartTrend[] = [
                    'date' => $d,
                    'label' => $dayLabel,
                    'total' => (int) $item->total,
                    'completed' => (int) $item->completed,
                    'cancelled' => (int) $item->cancelled,
                    'active' => (int) $item->active,
                ];
            } else {
                $chartTrend[] = [
                    'date' => $d,
                    'label' => $dayLabel,
                    'total' => 0,
                    'completed' => 0,
                    'cancelled' => 0,
                    'active' => 0,
                ];
            }
        }

        // 3. Clinic Distribution (Pie / Donut Chart)
        $clinicDistributionQuery = Pendaftaran::join('polikliniks', 'pendaftarans.poliklinik_id', '=', 'polikliniks.id')
            ->whereBetween('pendaftarans.visit_date', [Carbon::now()->subDays(30)->format('Y-m-d'), $today]);

        if ($doctorId) {
            $clinicDistributionQuery->where('pendaftarans.dokter_id', $doctorId);
        }

        $clinicDistribution = $clinicDistributionQuery->select(
            'polikliniks.name as name',
            'polikliniks.queue_prefix as prefix',
            DB::raw('COUNT(pendaftarans.id) as count')
        )
            ->groupBy('polikliniks.id', 'polikliniks.name', 'polikliniks.queue_prefix')
            ->orderBy('count', 'desc')
            ->get();

        // 4. Recent / Today's Active Registrations
        $recentQuery = Pendaftaran::with(['patient', 'dokter', 'poliklinik'])
            ->whereDate('visit_date', $today)
            ->orderBy('created_at', 'desc');

        if ($doctorId) {
            $recentQuery->where('dokter_id', $doctorId);
        }

        $recentRegistrations = $recentQuery->limit(8)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'metrics' => [
                    'total_patients' => $totalPatients,
                    'today_registrations' => $todayRegistrations,
                    'waiting_count' => $waitingCount,
                    'in_progress_count' => $inProgressCount,
                    'completed_count' => $completedCount,
                    'cancelled_count' => $cancelledCount,
                ],
                'chart_trend' => $chartTrend,
                'clinic_distribution' => $clinicDistribution,
                'recent_registrations' => $recentRegistrations,
            ],
        ]);
    }
}
