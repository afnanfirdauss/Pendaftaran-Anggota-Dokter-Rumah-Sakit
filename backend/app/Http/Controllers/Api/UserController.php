<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * List all users
     */
    public function index(Request $request): JsonResponse
    {
        $role = $request->query('role');
        $query = User::with('dokter.poliklinik')->orderBy('id', 'asc');

        if ($role && in_array($role, ['admin', 'petugas', 'dokter'])) {
            $query->where('role', $role);
        }

        $users = $query->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'phone' => $u->phone,
                'is_active' => $u->is_active,
                'created_at' => $u->created_at->format('Y-m-d H:i'),
                'dokter' => $u->dokter ? [
                    'id' => $u->dokter->id,
                    'name' => $u->dokter->name,
                    'specialization' => $u->dokter->specialization,
                    'poliklinik' => $u->dokter->poliklinik?->name,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Create user account (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,petugas,dokter',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'boolean',
            'dokter_id' => 'nullable|exists:dokters,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['dokter_id']) && $validated['role'] === 'dokter') {
            $doctor = Dokter::find($validated['dokter_id']);
            if ($doctor) {
                $doctor->user_id = $user->id;
                $doctor->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun pengguna berhasil dibuat.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
            ],
        ], 201);
    }

    /**
     * Update user account
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,petugas,dokter',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'boolean',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $statusStr = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Akun pengguna berhasil {$statusStr}.",
            'data' => $user,
        ]);
    }
}
