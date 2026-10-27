<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Pasien extends Model
{
    use HasFactory;

    protected $fillable = [
        'medical_record_number',
        'nik',
        'name',
        'gender',
        'birth_date',
        'phone',
        'address',
        'first_registered_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'first_registered_at' => 'datetime',
    ];

    public function pendaftarans(): HasMany
    {
        return $this->hasMany(Pendaftaran::class, 'patient_id');
    }

    /**
     * Generate unique sequential Medical Record Number (e.g. RM-2026-00001)
     */
    public static function generateNextMRN(): string
    {
        $year = date('Y');
        $prefix = "RM-{$year}-";

        $lastPatient = self::where('medical_record_number', 'LIKE', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastPatient) {
            $lastNumber = (int) substr($lastPatient->medical_record_number, strlen($prefix));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
    }
}
