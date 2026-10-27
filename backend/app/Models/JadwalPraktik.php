<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JadwalPraktik extends Model
{
    use HasFactory;

    protected $fillable = [
        'dokter_id',
        'poliklinik_id',
        'day_of_week',
        'day_name',
        'start_time',
        'end_time',
        'quota',
        'is_active',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'quota' => 'integer',
        'is_active' => 'boolean',
    ];

    public function dokter(): BelongsTo
    {
        return $this->belongsTo(Dokter::class);
    }

    public function poliklinik(): BelongsTo
    {
        return $this->belongsTo(Poliklinik::class);
    }

    public function pendaftarans(): HasMany
    {
        return $this->hasMany(Pendaftaran::class);
    }

    /**
     * Get remaining quota for a specific date
     */
    public function getRemainingQuota(string $date): int
    {
        $registeredCount = $this->pendaftarans()
            ->where('visit_date', $date)
            ->where('status', '!=', 'cancelled')
            ->count();

        return max(0, $this->quota - $registeredCount);
    }
}
