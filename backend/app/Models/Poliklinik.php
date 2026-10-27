<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poliklinik extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'queue_prefix',
        'description',
        'floor',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function dokters(): HasMany
    {
        return $this->hasMany(Dokter::class);
    }

    public function jadwalPraktiks(): HasMany
    {
        return $this->hasMany(JadwalPraktik::class);
    }

    public function pendaftarans(): HasMany
    {
        return $this->hasMany(Pendaftaran::class);
    }
}
