<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pasien;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PasienController extends Controller
{
    /**
     * Get paginated patient list with search and filters
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $gender = $request->query('gender');
        $perPage = (int) $request->query('per_page', 15);

        $query = Pasien::query()->orderBy('id', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('medical_record_number', 'LIKE', "%{$search}%")
                    ->orWhere('name', 'LIKE', "%{$search}%")
                    ->orWhere('nik', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($gender) && in_array($gender, ['L', 'P'])) {
            $query->where('gender', $gender);
        }

        $patients = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    /**
     * Preview the next automatic Medical Record Number (NRM)
     */
    public function nextMRN(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'next_mrn' => Pasien::generateNextMRN(),
            ],
        ]);
    }

    /**
     * Store a newly created patient with automatic unique MRN
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'nullable|string|size:16|unique:pasiens,nik',
            'gender' => 'required|in:L,P',
            'birth_date' => 'required|date|before_or_equal:today',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
        ]);

        // Duplicate sanity check: check if same name AND same birth date already exists
        $existing = Pasien::where('name', 'LIKE', $validated['name'])
            ->where('birth_date', $validated['birth_date'])
            ->first();

        if ($existing && !$request->boolean('confirm_duplicate')) {
            return response()->json([
                'success' => false,
                'is_potential_duplicate' => true,
                'message' => "Pasien dengan nama '{$existing->name}' dan tanggal lahir yang sama sudah terdaftar (No. RM: {$existing->medical_record_number}). Lanjutkan jika ini pasien berbeda.",
                'existing_patient' => [
                    'id' => $existing->id,
                    'medical_record_number' => $existing->medical_record_number,
                    'name' => $existing->name,
                ],
            ], 409);
        }

        // Generate MRN atomically within transaction
        $patient = DB::transaction(function () use ($validated) {
            $mrn = Pasien::generateNextMRN();

            return Pasien::create([
                'medical_record_number' => $mrn,
                'nik' => $validated['nik'] ?? null,
                'name' => $validated['name'],
                'gender' => $validated['gender'],
                'birth_date' => $validated['birth_date'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'first_registered_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil didaftarkan.',
            'data' => $patient,
        ], 201);
    }

    /**
     * Display patient details and complete visit history
     */
    public function show(int $id): JsonResponse
    {
        $patient = Pasien::with([
            'pendaftarans' => function ($query) {
                $query->with(['dokter', 'poliklinik', 'jadwalPraktik', 'registeredBy'])
                    ->orderBy('visit_date', 'desc')
                    ->orderBy('id', 'desc');
            },
        ])->find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Pasien tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    /**
     * Update the specified patient (MRN cannot be changed)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $patient = Pasien::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Pasien tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => ['nullable', 'string', 'size:16', Rule::unique('pasiens', 'nik')->ignore($patient->id)],
            'gender' => 'required|in:L,P',
            'birth_date' => 'required|date|before_or_equal:today',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
        ]);

        $patient->update([
            'name' => $validated['name'],
            'nik' => $validated['nik'] ?? null,
            'gender' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil diperbarui.',
            'data' => $patient,
        ]);
    }

    /**
     * Delete or archive patient if allowed
     */
    public function destroy(int $id): JsonResponse
    {
        $patient = Pasien::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Pasien tidak ditemukan.',
            ], 404);
        }

        // Prevent deletion if patient has existing completed visits
        $hasVisits = $patient->pendaftarans()->where('status', '!=', 'cancelled')->exists();
        if ($hasVisits) {
            return response()->json([
                'success' => false,
                'message' => 'Pasien tidak dapat dihapus karena memiliki riwayat kunjungan aktif atau selesai.',
            ], 422);
        }

        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil dihapus.',
        ]);
    }
}
