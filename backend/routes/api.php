<?php

use App\Http\Controllers\Api\AntreanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DokterController;
use App\Http\Controllers\Api\JadwalPraktikController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\PasienController;
use App\Http\Controllers\Api\PendaftaranController;
use App\Http\Controllers\Api\PoliklinikController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/quick-demo-login', [AuthController::class, 'quickDemoLogin']);
});

// Public TV Kiosk / Waiting Room Queue Display
Route::get('/antrean/public-display', [AntreanController::class, 'publicDisplay']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'MediQueue API',
        'timestamp' => now()->toIso8601String(),
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes (All Roles)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Dashboard (Aggregates & Recharts Trends)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Patients (Pasien)
    Route::get('/pasiens/next-mrn', [PasienController::class, 'nextMRN']);
    Route::apiResource('pasiens', PasienController::class);

    // Lookups & Schedules
    Route::get('/polikliniks', [PoliklinikController::class, 'index']);
    Route::get('/dokters', [DokterController::class, 'index']);
    Route::get('/jadwal-praktiks', [JadwalPraktikController::class, 'index']);
    Route::get('/jadwal-praktiks/available', [JadwalPraktikController::class, 'available']);

    // Visit Registration (Pendaftaran)
    Route::post('/pendaftarans', [PendaftaranController::class, 'store']);
    Route::get('/pendaftarans/{id}', [PendaftaranController::class, 'show']);
    Route::get('/pendaftarans/{id}/slip', [PendaftaranController::class, 'slip']);

    // Queue Management (Antrean)
    Route::get('/antrean', [AntreanController::class, 'index']);
    Route::post('/antrean/{id}/call', [AntreanController::class, 'call']);
    Route::patch('/antrean/{id}/status', [AntreanController::class, 'updateStatus']);

    // Reports (Laporan)
    Route::get('/laporan/summary', [LaporanController::class, 'summary']);
    Route::get('/laporan/export-csv', [LaporanController::class, 'exportCsv']);

    /*
    |--------------------------------------------------------------------------
    | Admin Only Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        // Clinic Master
        Route::post('/polikliniks', [PoliklinikController::class, 'store']);
        Route::put('/polikliniks/{id}', [PoliklinikController::class, 'update']);
        Route::patch('/polikliniks/{id}/toggle-active', [PoliklinikController::class, 'toggleActive']);

        // Doctor Master
        Route::post('/dokters', [DokterController::class, 'store']);
        Route::put('/dokters/{id}', [DokterController::class, 'update']);
        Route::patch('/dokters/{id}/toggle-active', [DokterController::class, 'toggleActive']);

        // Schedule Master
        Route::post('/jadwal-praktiks', [JadwalPraktikController::class, 'store']);
        Route::put('/jadwal-praktiks/{id}', [JadwalPraktikController::class, 'update']);
        Route::delete('/jadwal-praktiks/{id}', [JadwalPraktikController::class, 'destroy']);

        // User Accounts
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{id}/toggle-active', [UserController::class, 'toggleActive']);
    });
});
