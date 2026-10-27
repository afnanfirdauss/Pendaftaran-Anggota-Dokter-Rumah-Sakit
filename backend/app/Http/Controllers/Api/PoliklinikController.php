<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poliklinik;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PoliklinikController extends Controller
{
    /**
     * List all poliklinik
     */
    public function index(Request $request): JsonResponse
    {
        $activeOnly = $request->boolean('active_only');
        $query = Poliklinik::withCount(['dokters', 'jadwalPraktiks']);

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        $clinics = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $clinics,
        ]);
    }

    /**
     * Store new poliklinik
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:polikliniks,code',
            'name' => 'required|string|max:100',
            'queue_prefix' => 'required|string|max:5',
            'description' => 'nullable|string',
            'floor' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $clinic = Poliklinik::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Poliklinik berhasil ditambahkan.',
            'data' => $clinic,
        ], 201);
    }

    /**
     * Update poliklinik
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $clinic = Poliklinik::find($id);

        if (!$clinic) {
            return response()->json([
                'success' => false,
                'message' => 'Poliklinik tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', Rule::unique('polikliniks', 'code')->ignore($clinic->id)],
            'name' => 'required|string|max:100',
            'queue_prefix' => 'required|string|max:5',
            'description' => 'nullable|string',
            'floor' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $clinic->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Poliklinik berhasil diperbarui.',
            'data' => $clinic,
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(int $id): JsonResponse
    {
        $clinic = Poliklinik::find($id);

        if (!$clinic) {
            return response()->json([
                'success' => false,
                'message' => 'Poliklinik tidak ditemukan.',
            ], 404);
        }

        $clinic->is_active = !$clinic->is_active;
        $clinic->save();

        $statusStr = $clinic->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Poliklinik berhasil {$statusStr}.",
            'data' => $clinic,
        ]);
    }
}
