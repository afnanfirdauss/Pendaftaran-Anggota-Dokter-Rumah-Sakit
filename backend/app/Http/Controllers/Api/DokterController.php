<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DokterController extends Controller
{
    /**
     * List all dokters with clinic and schedules
     */
    public function index(Request $request): JsonResponse
    {
        $clinicId = $request->query('poliklinik_id');
        $activeOnly = $request->boolean('active_only');

        $query = Dokter::with(['poliklinik', 'jadwalPraktiks']);

        if ($clinicId) {
            $query->where('poliklinik_id', $clinicId);
        }

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        $doctors = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $doctors,
        ]);
    }

    /**
     * Store new dokter
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'poliklinik_id' => 'required|exists:polikliniks,id',
            'sip' => 'required|string|max:50|unique:dokters,sip',
            'name' => 'required|string|max:150',
            'specialization' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'is_active' => 'boolean',
        ]);

        $doctor = Dokter::create($validated);
        $doctor->load('poliklinik');

        return response()->json([
            'success' => true,
            'message' => 'Data dokter berhasil ditambahkan.',
            'data' => $doctor,
        ], 201);
    }

    /**
     * Update dokter
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $doctor = Dokter::find($id);

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Dokter tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'poliklinik_id' => 'required|exists:polikliniks,id',
            'sip' => ['required', 'string', 'max:50', Rule::unique('dokters', 'sip')->ignore($doctor->id)],
            'name' => 'required|string|max:150',
            'specialization' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'is_active' => 'boolean',
        ]);

        $doctor->update($validated);
        $doctor->load('poliklinik');

        return response()->json([
            'success' => true,
            'message' => 'Data dokter berhasil diperbarui.',
            'data' => $doctor,
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(int $id): JsonResponse
    {
        $doctor = Dokter::find($id);

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Dokter tidak ditemukan.',
            ], 404);
        }

        $doctor->is_active = !$doctor->is_active;
        $doctor->save();

        $statusStr = $doctor->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Dokter berhasil {$statusStr}.",
            'data' => $doctor,
        ]);
    }
}
