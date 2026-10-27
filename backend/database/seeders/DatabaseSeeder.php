<?php

namespace Database\Seeders;

use App\Models\Dokter;
use App\Models\JadwalPraktik;
use App\Models\Pasien;
use App\Models\Pendaftaran;
use App\Models\Poliklinik;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create System Users
        $admin = User::create([
            'name' => 'Administrator MediQueue',
            'email' => 'admin@mediqueue.test',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '081234567890',
            'is_active' => true,
        ]);

        $petugas1 = User::create([
            'name' => 'Rina Andriani (Petugas Loket 1)',
            'email' => 'petugas@mediqueue.test',
            'password' => Hash::make('password'),
            'role' => 'petugas',
            'phone' => '081298765432',
            'is_active' => true,
        ]);

        $petugas2 = User::create([
            'name' => 'Bagus Wicaksono (Petugas Loket 2)',
            'email' => 'bagus@mediqueue.test',
            'password' => Hash::make('password'),
            'role' => 'petugas',
            'phone' => '081311223344',
            'is_active' => true,
        ]);

        // 2. Create Poliklinik
        $clinicsData = [
            [
                'code' => 'UMU',
                'name' => 'Poliklinik Umum',
                'queue_prefix' => 'A',
                'description' => 'Pelayanan kesehatan umum tingkat pertama, pemeriksaan awal, dan konsultasi keluhan umum.',
                'floor' => 'Lantai 1 Gedung A',
            ],
            [
                'code' => 'GIG',
                'name' => 'Poliklinik Gigi & Mulut',
                'queue_prefix' => 'B',
                'description' => 'Pelayanan perawatan gigi, penambalan, pencabutan, pembersihan karang, dan ortodonsia.',
                'floor' => 'Lantai 1 Gedung B',
            ],
            [
                'code' => 'ANK',
                'name' => 'Poliklinik Anak (Pediatri)',
                'queue_prefix' => 'C',
                'description' => 'Pelayanan kesehatan anak, tumbuh kembang, imunisasi, dan penanganan penyakit balita/anak.',
                'floor' => 'Lantai 2 Gedung A',
            ],
            [
                'code' => 'INT',
                'name' => 'Poliklinik Penyakit Dalam',
                'queue_prefix' => 'D',
                'description' => 'Diagnosis dan penanganan medis non-bedah organ dalam dewasa seperti kardiovaskular, diabetes, dan pencernaan.',
                'floor' => 'Lantai 2 Gedung B',
            ],
            [
                'code' => 'MAT',
                'name' => 'Poliklinik Mata (Oftalmologi)',
                'queue_prefix' => 'E',
                'description' => 'Pemeriksaan tajam penglihatan, refraksi kacamata, katarak, dan penanganan gangguan mata lainnya.',
                'floor' => 'Lantai 3 Gedung A',
            ],
        ];

        $clinics = [];
        foreach ($clinicsData as $c) {
            $clinics[$c['code']] = Poliklinik::create($c);
        }

        // 3. Create Doctors and their User Accounts
        $doctorsData = [
            [
                'name' => 'dr. Reza Pratama',
                'email' => 'dr.reza@mediqueue.test',
                'sip' => 'SIP-501/DKK/2021/001',
                'specialization' => 'Dokter Umum',
                'poliklinik_id' => $clinics['UMU']->id,
                'phone' => '081233445566',
            ],
            [
                'name' => 'dr. Dian Kusuma Wardani',
                'email' => 'dr.dian@mediqueue.test',
                'sip' => 'SIP-501/DKK/2022/002',
                'specialization' => 'Dokter Umum',
                'poliklinik_id' => $clinics['UMU']->id,
                'phone' => '081233445567',
            ],
            [
                'name' => 'drg. Maya Lestari, Sp.KG',
                'email' => 'dr.maya@mediqueue.test',
                'sip' => 'SIP-502/DKK/2020/003',
                'specialization' => 'Spesialis Konservasi Gigi',
                'poliklinik_id' => $clinics['GIG']->id,
                'phone' => '081233445568',
            ],
            [
                'name' => 'drg. Hendra Gunawan',
                'email' => 'dr.hendra@mediqueue.test',
                'sip' => 'SIP-502/DKK/2023/004',
                'specialization' => 'Dokter Gigi',
                'poliklinik_id' => $clinics['GIG']->id,
                'phone' => '081233445569',
            ],
            [
                'name' => 'dr. Sarah Wijaya, Sp.A',
                'email' => 'dr.sarah@mediqueue.test',
                'sip' => 'SIP-503/DKK/2019/005',
                'specialization' => 'Spesialis Anak',
                'poliklinik_id' => $clinics['ANK']->id,
                'phone' => '081233445570',
            ],
            [
                'name' => 'dr. Fajar Nugroho, Sp.A',
                'email' => 'dr.fajar@mediqueue.test',
                'sip' => 'SIP-503/DKK/2022/006',
                'specialization' => 'Spesialis Anak',
                'poliklinik_id' => $clinics['ANK']->id,
                'phone' => '081233445571',
            ],
            [
                'name' => 'dr. Ahmad Fauzi, Sp.PD',
                'email' => 'dr.ahmad@mediqueue.test',
                'sip' => 'SIP-504/DKK/2018/007',
                'specialization' => 'Spesialis Penyakit Dalam',
                'poliklinik_id' => $clinics['INT']->id,
                'phone' => '081233445572',
            ],
            [
                'name' => 'dr. Nurul Aisyah, Sp.PD',
                'email' => 'dr.nurul@mediqueue.test',
                'sip' => 'SIP-504/DKK/2021/008',
                'specialization' => 'Spesialis Penyakit Dalam',
                'poliklinik_id' => $clinics['INT']->id,
                'phone' => '081233445573',
            ],
            [
                'name' => 'dr. Budi Santoso, Sp.M',
                'email' => 'dr.budi@mediqueue.test',
                'sip' => 'SIP-505/DKK/2019/009',
                'specialization' => 'Spesialis Mata',
                'poliklinik_id' => $clinics['MAT']->id,
                'phone' => '081233445574',
            ],
            [
                'name' => 'dr. Ratna Kartika, Sp.M',
                'email' => 'dr.ratna@mediqueue.test',
                'sip' => 'SIP-505/DKK/2023/010',
                'specialization' => 'Spesialis Mata',
                'poliklinik_id' => $clinics['MAT']->id,
                'phone' => '081233445575',
            ],
        ];

        $doctors = [];
        foreach ($doctorsData as $d) {
            $docUser = User::create([
                'name' => $d['name'],
                'email' => $d['email'],
                'password' => Hash::make('password'),
                'role' => 'dokter',
                'phone' => $d['phone'],
                'is_active' => true,
            ]);

            $doctors[] = Dokter::create([
                'user_id' => $docUser->id,
                'poliklinik_id' => $d['poliklinik_id'],
                'sip' => $d['sip'],
                'name' => $d['name'],
                'specialization' => $d['specialization'],
                'phone' => $d['phone'],
                'email' => $d['email'],
                'is_active' => true,
            ]);
        }

        // 4. Create Practice Schedules (Jadwal Praktik)
        $dayNames = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];

        $schedules = [];
        foreach ($doctors as $idx => $doc) {
            // Allocate 3-4 days per week per doctor
            $days = ($idx % 2 === 0) ? [1, 2, 3, 5] : [2, 4, 5, 6];
            $startTime = ($idx % 2 === 0) ? '08:00:00' : '13:00:00';
            $endTime = ($idx % 2 === 0) ? '12:00:00' : '17:00:00';

            foreach ($days as $day) {
                $schedules[] = JadwalPraktik::create([
                    'dokter_id' => $doc->id,
                    'poliklinik_id' => $doc->poliklinik_id,
                    'day_of_week' => $day,
                    'day_name' => $dayNames[$day],
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'quota' => 25,
                    'is_active' => true,
                ]);
            }
        }

        // Also ensure EVERY clinic has at least one active doctor schedule TODAY!
        $todayDayOfWeek = (int) date('N'); // 1 (Mon) - 7 (Sun)
        foreach ($clinics as $c) {
            $hasToday = JadwalPraktik::where('poliklinik_id', $c->id)
                ->where('day_of_week', $todayDayOfWeek)
                ->exists();

            if (!$hasToday) {
                $clinicDoc = Dokter::where('poliklinik_id', $c->id)->first();
                if ($clinicDoc) {
                    $schedules[] = JadwalPraktik::create([
                        'dokter_id' => $clinicDoc->id,
                        'poliklinik_id' => $c->id,
                        'day_of_week' => $todayDayOfWeek,
                        'day_name' => $dayNames[$todayDayOfWeek],
                        'start_time' => '08:30:00',
                        'end_time' => '15:30:00',
                        'quota' => 30,
                        'is_active' => true,
                    ]);
                }
            }
        }

        // 5. Create 50+ Realistic Patients
        $indonesianNames = [
            ['Joko Widodo', 'L', '1985-06-21', 'Jl. Merdeka No. 45, Jakarta Pusat'],
            ['Siti Nurhaliza', 'P', '1992-04-15', 'Jl. Kenanga No. 12, Bandung'],
            ['Bambang Soeprapto', 'L', '1978-11-03', 'Jl. Diponegoro No. 88, Semarang'],
            ['Dewi Sartika', 'P', '1995-08-25', 'Jl. Gatot Subroto No. 34, Surabaya'],
            ['Eko Prasetyo', 'L', '1990-01-19', 'Jl. Malioboro No. 102, Yogyakarta'],
            ['Fitriani Rahmawati', 'P', '2001-07-09', 'Jl. Sudirman No. 15, Medan'],
            ['Guruh Purnomo', 'L', '1982-12-30', 'Jl. Basuki Rahmat No. 7, Surabaya'],
            ['Hesti Purwanti', 'P', '1998-03-14', 'Jl. Riau No. 45, Pekanbaru'],
            ['Irfan Hakim', 'L', '1987-05-18', 'Jl. Asia Afrika No. 22, Bandung'],
            ['Julia Pratiwi', 'P', '1993-10-05', 'Jl. Pahlawan No. 66, Solo'],
            ['Kurniawan Dwi', 'L', '1980-09-12', 'Jl. Ahmad Yani No. 50, Malang'],
            ['Lestari Indah', 'P', '2003-02-28', 'Jl. Hayam Wuruk No. 89, Jakarta Barat'],
            ['Muhammad Rizky', 'L', '2016-11-20', 'Jl. Cempaka Putih No. 14, Jakarta Pusat'],
            ['Nadia Safitri', 'P', '2018-05-11', 'Jl. Dago No. 110, Bandung'],
            ['Oki Setiawan', 'L', '1975-03-07', 'Jl. Veteran No. 3, Palembang'],
            ['Putri Maharani', 'P', '1999-12-17', 'Jl. Pemuda No. 40, Bogor'],
            ['Qoriatul Hasanah', 'P', '1994-06-02', 'Jl. Siliwangi No. 78, Cirebon'],
            ['Rian Ardiansyah', 'L', '1989-08-14', 'Jl. Kaliurang Km 5 No. 12, Sleman'],
            ['Sari Wulandari', 'P', '1991-09-29', 'Jl. Teuku Umar No. 55, Denpasar'],
            ['Taufik Hidayat', 'L', '1983-04-10', 'Jl. Raden Inten No. 19, Bandar Lampung'],
            ['Umar Wirahadikusuma', 'L', '1968-10-23', 'Jl. Kartini No. 27, Jepara'],
            ['Vina Panduwinata', 'P', '1996-01-08', 'Jl. Thamrin No. 8, Jakarta Pusat'],
            ['Wahyu Hidayat', 'L', '1986-07-22', 'Jl. Imam Bonjol No. 16, Padang'],
            ['Xaverius Tan', 'L', '1979-05-30', 'Jl. Gajah Mada No. 101, Pontianak'],
            ['Yulia Anggraini', 'P', '2000-11-15', 'Jl. Sudirman No. 70, Balikpapan'],
            ['Zainal Abidin', 'L', '1972-02-14', 'Jl. Sam Ratulangi No. 44, Manado'],
            ['Anisa Rahma', 'P', '2019-03-01', 'Jl. Melati No. 5, Depok'],
            ['Bayu Pratama', 'L', '2015-08-18', 'Jl. Anggrek No. 19, Bekasi'],
            ['Cahya Kamila', 'P', '1997-12-04', 'Jl. Flamboyan No. 2, Tangerang'],
            ['Dimas Anggara', 'L', '1993-04-26', 'Jl. Bougenville No. 11, Tangerang Selatan'],
            ['Endah Sulastri', 'P', '1981-06-16', 'Jl. Mawar No. 33, Serang'],
            ['Farhan Maulana', 'L', '1990-11-28', 'Jl. Melati Indah No. 8, Magelang'],
            ['Gita Gutawa', 'P', '1994-08-11', 'Jl. Kusumanegara No. 90, Yogyakarta'],
            ['Haris Munandar', 'L', '1984-01-05', 'Jl. Pandanaran No. 71, Semarang'],
            ['Intan Permata', 'P', '2002-09-17', 'Jl. Sukajadi No. 135, Bandung'],
            ['Joni Iskandar', 'L', '1976-07-13', 'Jl. Darmo No. 44, Surabaya'],
            ['Kartika Putri', 'P', '1991-02-10', 'Jl. Urip Sumoharjo No. 8, Makassar'],
            ['Lukman Sardi', 'L', '1971-07-14', 'Jl. Pettarani No. 12, Makassar'],
            ['Mega Utami', 'P', '1998-04-03', 'Jl. Slamet Riyadi No. 210, Surakarta'],
            ['Naufal Zaki', 'L', '2020-01-22', 'Jl. Brigjen Katamso No. 34, Medan'],
            ['Olivia Zalianty', 'P', '1981-10-18', 'Jl. Pemuda No. 18, Rawamangun, Jakarta'],
            ['Panji Petualang', 'L', '1989-07-27', 'Jl. Margonda Raya No. 400, Depok'],
            ['Rina Nose', 'P', '1984-01-16', 'Jl. Setiabudi No. 60, Bandung'],
            ['Surya Saputra', 'L', '1975-07-05', 'Jl. TB Simatupang No. 25, Jakarta Selatan'],
            ['Titi Kamal', 'P', '1981-12-07', 'Jl. Senopati No. 18, Jakarta Selatan'],
            ['Uus Wijaya', 'L', '1990-12-23', 'Jl. Kemang Raya No. 14, Jakarta Selatan'],
            ['Vicky Shu', 'P', '1987-07-08', 'Jl. Pajajaran No. 42, Bogor'],
            ['Widi Mulia', 'P', '1979-04-29', 'Jl. Ciumbuleuit No. 88, Bandung'],
            ['Yayan Ruhian', 'L', '1968-10-19', 'Jl. Cikini Raya No. 9, Jakarta Pusat'],
            ['Zaskia Sungkar', 'P', '1990-12-22', 'Jl. Pondok Indah No. 55, Jakarta Selatan'],
        ];

        $patients = [];
        $currentYear = date('Y');
        foreach ($indonesianNames as $index => $item) {
            $mrn = sprintf("RM-%s-%05d", $currentYear, $index + 1);
            $nik = sprintf("3271%02d%06d%04d", ($index % 30) + 1, rand(100000, 999999), $index + 1);
            $phone = sprintf("08%02d%08d", rand(11, 23), rand(10000000, 99999999));
            $firstRegDate = Carbon::now()->subDays(rand(10, 180))->subHours(rand(1, 10));

            $patients[] = Pasien::create([
                'medical_record_number' => $mrn,
                'nik' => $nik,
                'name' => $item[0],
                'gender' => $item[1],
                'birth_date' => $item[2],
                'phone' => $phone,
                'address' => $item[3],
                'first_registered_at' => $firstRegDate,
            ]);
        }

        // 6. Create Historical Registrations for the past 30 days (for Recharts graphs)
        $regCounter = 1;
        for ($daysAgo = 30; $daysAgo >= 1; $daysAgo--) {
            $date = Carbon::now()->subDays($daysAgo)->format('Y-m-d');
            $dayOfWeek = (int) Carbon::parse($date)->format('N');

            // Skip Sundays for realistic hospital volume (or very low volume)
            if ($dayOfWeek === 7) {
                continue;
            }

            // Generate 8 - 18 visits per day distributed across clinics
            $dailyCount = rand(8, 18);
            for ($k = 0; $k < $dailyCount; $k++) {
                $patient = $patients[array_rand($patients)];
                $clinic = $clinics[array_rand($clinics)];
                $doctor = Dokter::where('poliklinik_id', $clinic->id)->inRandomOrder()->first();
                $schedule = JadwalPraktik::where('poliklinik_id', $clinic->id)->first();

                if (!$doctor || !$schedule) {
                    continue;
                }

                $seq = $k + 1;
                $queueNo = sprintf("%s-%03d", $clinic->queue_prefix, $seq);
                $regNumber = sprintf("REG-%s-%04d", str_replace('-', '', $date), $regCounter++);

                // Status distribution for past days: mostly completed (85%), some cancelled (15%)
                $isCancelled = (rand(1, 100) <= 12);
                $status = $isCancelled ? 'cancelled' : 'completed';

                $calledAt = Carbon::parse($date . ' ' . $schedule->start_time)->addMinutes($seq * 12);
                $startedAt = (clone $calledAt)->addMinutes(3);
                $completedAt = (clone $startedAt)->addMinutes(rand(10, 20));

                Pendaftaran::create([
                    'registration_number' => $regNumber,
                    'queue_number' => $queueNo,
                    'queue_sequence' => $seq,
                    'patient_id' => $patient->id,
                    'dokter_id' => $doctor->id,
                    'poliklinik_id' => $clinic->id,
                    'jadwal_praktik_id' => $schedule->id,
                    'visit_date' => $date,
                    'visit_type' => (rand(1, 10) > 7) ? 'kontrol' : 'umum',
                    'status' => $status,
                    'called_at' => $calledAt,
                    'started_at' => $startedAt,
                    'completed_at' => $status === 'completed' ? $completedAt : null,
                    'notes' => (rand(1, 10) > 6) ? 'Pemeriksaan rutin berkala.' : null,
                    'cancellation_reason' => $isCancelled ? 'Pasien berhalangan hadir dan membatalkan pendaftaran.' : null,
                    'registered_by_user_id' => (rand(1, 2) === 1) ? $petugas1->id : $petugas2->id,
                    'created_at' => Carbon::parse($date . ' 07:30:00')->addMinutes($seq * 5),
                ]);
            }
        }

        // 7. Create TODAY's Active Registrations across statuses (for Live Demo & Display screen!)
        $today = date('Y-m-d');
        $todaySeq = [
            'A' => 1,
            'B' => 1,
            'C' => 1,
            'D' => 1,
            'E' => 1,
        ];

        // Seed 2-4 patients per clinic today with diverse statuses
        foreach ($clinics as $code => $clinic) {
            $clinicDoctors = Dokter::where('poliklinik_id', $clinic->id)->get();
            $clinicSchedule = JadwalPraktik::where('poliklinik_id', $clinic->id)->first();

            if ($clinicDoctors->isEmpty() || !$clinicSchedule) {
                continue;
            }

            $prefix = $clinic->queue_prefix;

            // Patient 1: Completed
            $p1 = $patients[($todaySeq[$prefix] * 3) % count($patients)];
            $seq1 = $todaySeq[$prefix]++;
            Pendaftaran::create([
                'registration_number' => sprintf("REG-%s-%04d", str_replace('-', '', $today), $regCounter++),
                'queue_number' => sprintf("%s-%03d", $prefix, $seq1),
                'queue_sequence' => $seq1,
                'patient_id' => $p1->id,
                'dokter_id' => $clinicDoctors->first()->id,
                'poliklinik_id' => $clinic->id,
                'jadwal_praktik_id' => $clinicSchedule->id,
                'visit_date' => $today,
                'visit_type' => 'umum',
                'status' => 'completed',
                'called_at' => Carbon::now()->subMinutes(50),
                'started_at' => Carbon::now()->subMinutes(45),
                'completed_at' => Carbon::now()->subMinutes(25),
                'notes' => 'Pasien mengeluhkan demam ringan, sudah diberikan resep.',
                'registered_by_user_id' => $petugas1->id,
                'created_at' => Carbon::now()->subMinutes(60),
            ]);

            // Patient 2: In Progress (currently consulting with doctor)
            $p2 = $patients[(($todaySeq[$prefix] * 3) + 1) % count($patients)];
            $seq2 = $todaySeq[$prefix]++;
            Pendaftaran::create([
                'registration_number' => sprintf("REG-%s-%04d", str_replace('-', '', $today), $regCounter++),
                'queue_number' => sprintf("%s-%03d", $prefix, $seq2),
                'queue_sequence' => $seq2,
                'patient_id' => $p2->id,
                'dokter_id' => $clinicDoctors->first()->id,
                'poliklinik_id' => $clinic->id,
                'jadwal_praktik_id' => $clinicSchedule->id,
                'visit_date' => $today,
                'visit_type' => 'kontrol',
                'status' => 'in_progress',
                'called_at' => Carbon::now()->subMinutes(15),
                'started_at' => Carbon::now()->subMinutes(10),
                'notes' => 'Konsultasi lanjutan hasil lab.',
                'registered_by_user_id' => $petugas1->id,
                'created_at' => Carbon::now()->subMinutes(30),
            ]);

            // Patient 3: Called (just called to enter doctor room)
            $p3 = $patients[(($todaySeq[$prefix] * 3) + 2) % count($patients)];
            $seq3 = $todaySeq[$prefix]++;
            Pendaftaran::create([
                'registration_number' => sprintf("REG-%s-%04d", str_replace('-', '', $today), $regCounter++),
                'queue_number' => sprintf("%s-%03d", $prefix, $seq3),
                'queue_sequence' => $seq3,
                'patient_id' => $p3->id,
                'dokter_id' => $clinicDoctors->first()->id,
                'poliklinik_id' => $clinic->id,
                'jadwal_praktik_id' => $clinicSchedule->id,
                'visit_date' => $today,
                'visit_type' => 'umum',
                'status' => 'called',
                'called_at' => Carbon::now()->subMinutes(2),
                'registered_by_user_id' => $petugas2->id,
                'created_at' => Carbon::now()->subMinutes(20),
            ]);

            // Patient 4: Waiting (waiting in queue lobby)
            $p4 = $patients[(($todaySeq[$prefix] * 3) + 3) % count($patients)];
            $seq4 = $todaySeq[$prefix]++;
            Pendaftaran::create([
                'registration_number' => sprintf("REG-%s-%04d", str_replace('-', '', $today), $regCounter++),
                'queue_number' => sprintf("%s-%03d", $prefix, $seq4),
                'queue_sequence' => $seq4,
                'patient_id' => $p4->id,
                'dokter_id' => $clinicDoctors->first()->id,
                'poliklinik_id' => $clinic->id,
                'jadwal_praktik_id' => $clinicSchedule->id,
                'visit_date' => $today,
                'visit_type' => 'umum',
                'status' => 'waiting',
                'registered_by_user_id' => $petugas2->id,
                'created_at' => Carbon::now()->subMinutes(10),
            ]);
        }
    }
}
