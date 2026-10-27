<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Standard Login with Email and Password
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $this->formatUserData($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Quick Demo Login for instant portfolio testing
     */
    public function quickDemoLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,petugas,dokter',
        ]);

        $user = User::where('role', $validated['role'])
            ->where('is_active', true)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun demo untuk role ini tidak ditemukan.',
            ], 404);
        }

        // Revoke old tokens for demo convenience and issue fresh token
        $user->tokens()->delete();
        $token = $user->createToken('demo_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => "Login demo sebagai {$user->role} berhasil.",
            'data' => [
                'user' => $this->formatUserData($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Get Authenticated User Details
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUserData($user),
            ],
        ]);
    }

    /**
     * Logout and Revoke Current Access Token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Helper to format user data with doctor association if available
     */
    private function formatUserData(User $user): array
    {
        $doctorData = null;
        if ($user->isDokter()) {
            $user->load('dokter.poliklinik');
            if ($user->dokter) {
                $doctorData = [
                    'id' => $user->dokter->id,
                    'name' => $user->dokter->name,
                    'sip' => $user->dokter->sip,
                    'specialization' => $user->dokter->specialization,
                    'poliklinik_id' => $user->dokter->poliklinik_id,
                    'poliklinik_name' => $user->dokter->poliklinik?->name,
                ];
            }
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'dokter' => $doctorData,
        ];
    }
}
