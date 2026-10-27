<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pendaftaran extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_number',
        'queue_number',
        'queue_sequence',
        'patient_id',
        'dokter_id',
        'poliklinik_id',
        'jadwal_praktik_id',
        'visit_date',
        'visit_type',
        'status',
        'called_at',
        'started_at',
        'completed_at',
        'notes',
        'cancellation_reason',
        'registered_by_user_id',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'called_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'queue_sequence' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Pasien::class, 'patient_id');
    }

    public function dokter(): BelongsTo
    {
        return $this->belongsTo(Dokter::class);
    }

    public function poliklinik(): BelongsTo
    {
        return $this->belongsTo(Poliklinik::class);
    }

    public function jadwalPraktik(): BelongsTo
    {
        return $this->belongsTo(JadwalPraktik::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by_user_id');
    }

    /**
     * Check if transition to next status is valid according to business rules
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = [
            'waiting' => ['called', 'cancelled'],
            'called' => ['in_progress', 'waiting', 'cancelled'],
            'in_progress' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ];

        return in_array($newStatus, $allowedTransitions[$this->status] ?? [], true);
    }

    /**
     * Scope for today's active queues
     */
    public function scopeToday($query)
    {
        return $query->where('visit_date', date('Y-m-d'));
    }

    /**
     * Scope for active queues (not completed or cancelled)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['waiting', 'called', 'in_progress']);
    }
}
