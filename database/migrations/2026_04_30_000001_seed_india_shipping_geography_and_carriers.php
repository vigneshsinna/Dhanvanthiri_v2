<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add zone_id to states ─────────────────────────────
        if (!Schema::hasColumn('states', 'zone_id')) {
            Schema::table('states', function (Blueprint $table) {
                $table->unsignedBigInteger('zone_id')->default(0)->after('country_id');
            });
        }

        // ── 2. Zones ─────────────────────────────────────────────
        DB::table('zones')->truncate();
        DB::table('zones')->insert([
            ['id' => 1, 'name' => 'Tamil Nadu',   'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'South India',  'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'North India',  'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── 3. Country: India ─────────────────────────────────────
        DB::table('countries')->truncate();
        DB::table('countries')->insert([
            'id'         => 1,
            'code'       => 'IN',
            'name'       => 'India',
            'status'     => 1,
            'zone_id'    => 0,   // zone is handled at state level
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 4. States ─────────────────────────────────────────────
        DB::table('states')->truncate();
        $now = now();

        // Tamil Nadu districts (zone 1)
        $tn_districts = [
            'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
            'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
            'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
            'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
            'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
            'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
            'Tirupattur', 'Tiruppur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
            'Villupuram', 'Virudhunagar',
        ];
        foreach ($tn_districts as $district) {
            DB::table('states')->insert([
                'name'       => $district,
                'country_id' => 1,
                'zone_id'    => 1,
                'status'     => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // South India states (zone 2)
        $south_states = [
            'Andhra Pradesh', 'Goa', 'Karnataka', 'Kerala',
            'Puducherry', 'Telangana',
        ];
        foreach ($south_states as $state) {
            DB::table('states')->insert([
                'name'       => $state,
                'country_id' => 1,
                'zone_id'    => 2,
                'status'     => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // North/Rest of India (zone 3)
        $north_states = [
            'Andaman & Nicobar Islands', 'Arunachal Pradesh', 'Assam', 'Bihar',
            'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli', 'Daman & Diu',
            'Delhi', 'Gujarat', 'Haryana', 'Himachal Pradesh',
            'Jammu & Kashmir', 'Jharkhand', 'Ladakh', 'Lakshadweep',
            'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
            'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
            'Rajasthan', 'Sikkim', 'Tripura', 'Uttar Pradesh',
            'Uttarakhand', 'West Bengal',
        ];
        foreach ($north_states as $state) {
            DB::table('states')->insert([
                'name'       => $state,
                'country_id' => 1,
                'zone_id'    => 3,
                'status'     => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── 5. Cities ─────────────────────────────────────────────
        DB::table('cities')->truncate();

        // Fetch state IDs now that they're inserted
        $stateMap = DB::table('states')->pluck('id', 'name');

        // Tamil Nadu – major cities per district
        $tn_cities = [
            'Ariyalur'        => ['Ariyalur', 'Sendhurai'],
            'Chengalpattu'    => ['Chengalpattu', 'Mahabalipuram', 'Tambaram'],
            'Chennai'         => ['Chennai', 'Ambattur', 'Avadi', 'Porur', 'Sholinganallur', 'Tambaram', 'Velachery'],
            'Coimbatore'      => ['Coimbatore', 'Tirupur City', 'Pollachi', 'Mettupalayam'],
            'Cuddalore'       => ['Cuddalore', 'Chidambaram', 'Panruti'],
            'Dharmapuri'      => ['Dharmapuri', 'Palacode'],
            'Dindigul'        => ['Dindigul', 'Kodaikanal', 'Palani'],
            'Erode'           => ['Erode', 'Bhavani', 'Gobichettipalayam', 'Perundurai'],
            'Kallakurichi'    => ['Kallakurichi', 'Sankarapuram'],
            'Kanchipuram'     => ['Kanchipuram', 'Sriperumbudur'],
            'Kanyakumari'     => ['Nagercoil', 'Padmanabhapuram', 'Marthandam'],
            'Karur'           => ['Karur', 'Kulithalai'],
            'Krishnagiri'     => ['Krishnagiri', 'Hosur', 'Denkanikottai'],
            'Madurai'         => ['Madurai', 'Melur', 'Usilampatti'],
            'Mayiladuthurai'  => ['Mayiladuthurai', 'Sirkazhi'],
            'Nagapattinam'    => ['Nagapattinam', 'Vedaranyam'],
            'Namakkal'        => ['Namakkal', 'Rasipuram', 'Tiruchengode'],
            'Nilgiris'        => ['Ooty', 'Coonoor', 'Gudalur'],
            'Perambalur'      => ['Perambalur', 'Arur'],
            'Pudukkottai'     => ['Pudukkottai', 'Aranthangi'],
            'Ramanathapuram'  => ['Ramanathapuram', 'Paramakudi', 'Rameswaram'],
            'Ranipet'         => ['Ranipet', 'Arcot', 'Walajapet'],
            'Salem'           => ['Salem', 'Mettur', 'Omalur', 'Edappadi'],
            'Sivaganga'       => ['Sivaganga', 'Karaikudi'],
            'Tenkasi'         => ['Tenkasi', 'Sankarankovil'],
            'Thanjavur'       => ['Thanjavur', 'Kumbakonam', 'Papanasam'],
            'Theni'           => ['Theni', 'Bodinayakanur', 'Uthamapalayam'],
            'Thoothukudi'     => ['Thoothukudi', 'Kovilpatti', 'Sathankulam'],
            'Tiruchirappalli' => ['Tiruchirappalli', 'Srirangam', 'Lalgudi'],
            'Tirunelveli'     => ['Tirunelveli', 'Palayamkottai', 'Nanguneri'],
            'Tirupattur'      => ['Tirupattur', 'Ambur', 'Vaniyambadi'],
            'Tiruppur'        => ['Tiruppur', 'Udumalpet'],
            'Tiruvannamalai'  => ['Tiruvannamalai', 'Polur', 'Arani'],
            'Tiruvarur'       => ['Tiruvarur', 'Mannargudi'],
            'Vellore'         => ['Vellore', 'Gudiyatham', 'Katpadi'],
            'Villupuram'      => ['Villupuram', 'Tindivanam', 'Gingee'],
            'Virudhunagar'    => ['Virudhunagar', 'Sivakasi', 'Srivilliputhur'],
        ];

        foreach ($tn_cities as $district => $cities) {
            $stateId = $stateMap[$district] ?? null;
            if (!$stateId) continue;
            foreach ($cities as $city) {
                DB::table('cities')->insert([
                    'name'       => $city,
                    'state_id'   => $stateId,
                    'country_id' => 1,
                    'cost'       => 40.00,
                    'status'     => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // South India – key cities
        $south_cities = [
            'Andhra Pradesh' => ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Rajahmundry', 'Nellore', 'Kakinada', 'Anantapur'],
            'Goa'            => ['Panaji', 'Margao', 'Vasco da Gama'],
            'Karnataka'      => ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Davangere', 'Ballari', 'Kalaburagi'],
            'Kerala'         => ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam', 'Palakkad', 'Alappuzha'],
            'Puducherry'     => ['Puducherry', 'Karaikal', 'Yanam'],
            'Telangana'      => ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Nalgonda'],
        ];

        foreach ($south_cities as $stateName => $cities) {
            $stateId = $stateMap[$stateName] ?? null;
            if (!$stateId) continue;
            foreach ($cities as $city) {
                DB::table('cities')->insert([
                    'name'       => $city,
                    'state_id'   => $stateId,
                    'country_id' => 1,
                    'cost'       => 120.00,
                    'status'     => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // North/Rest of India – key cities
        $north_cities = [
            'Delhi'         => ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Lajpat Nagar'],
            'Maharashtra'   => ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Navi Mumbai'],
            'Gujarat'       => ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Gandhinagar'],
            'Rajasthan'     => ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
            'Uttar Pradesh' => ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Ghaziabad'],
            'Madhya Pradesh'=> ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
            'West Bengal'   => ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur'],
            'Bihar'         => ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
            'Punjab'        => ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Chandigarh'],
            'Haryana'       => ['Gurugram', 'Faridabad', 'Ambala', 'Panipat', 'Rohtak', 'Hisar'],
            'Karnataka'     => [], // already in South India above
            'Assam'         => ['Guwahati', 'Silchar', 'Dibrugarh'],
            'Odisha'        => ['Bhubaneswar', 'Cuttack', 'Rourkela'],
            'Jharkhand'     => ['Ranchi', 'Jamshedpur', 'Dhanbad'],
            'Uttarakhand'   => ['Dehradun', 'Haridwar', 'Rishikesh'],
            'Himachal Pradesh' => ['Shimla', 'Manali', 'Dharamsala'],
            'Jammu & Kashmir'  => ['Srinagar', 'Jammu', 'Leh'],
            'Chhattisgarh'  => ['Raipur', 'Bhilai', 'Bilaspur'],
        ];

        foreach ($north_cities as $stateName => $cities) {
            if (empty($cities)) continue;
            $stateId = $stateMap[$stateName] ?? null;
            if (!$stateId) continue;
            foreach ($cities as $city) {
                DB::table('cities')->insert([
                    'name'       => $city,
                    'state_id'   => $stateId,
                    'country_id' => 1,
                    'cost'       => 125.00,
                    'status'     => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ── 6. Carriers ───────────────────────────────────────────
        DB::table('carrier_range_prices')->truncate();
        DB::table('carrier_ranges')->truncate();
        DB::table('carriers')->truncate();

        // ST Courier
        DB::table('carriers')->insert([
            'id'            => 1,
            'name'          => 'ST Courier',
            'logo'          => null,
            'transit_time'  => 3,
            'free_shipping' => 0,
            'status'        => 1,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        // DTDC
        DB::table('carriers')->insert([
            'id'            => 2,
            'name'          => 'DTDC',
            'logo'          => null,
            'transit_time'  => 5,
            'free_shipping' => 0,
            'status'        => 1,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        // ── 7. Carrier Ranges & Prices ─────────────────────────────
        // Weight-based ranges (in kg). Products use weight field in kg.
        // Ranges: 0-0.5, 0.5-1, 1-2, 2-5
        $ranges = [
            ['d1' => 0,   'd2' => 0.5],
            ['d1' => 0.5, 'd2' => 1.0],
            ['d1' => 1.0, 'd2' => 2.0],
            ['d1' => 2.0, 'd2' => 5.0],
        ];

        // Prices per carrier per zone [zone1=TN, zone2=South, zone3=North]
        // ST Courier covers TN (zone1) and South India (zone2); not North India
        $st_prices = [
            // zone1 (TN)      zone2 (South India)
            [1 => 40,  2 => 90],
            [1 => 70,  2 => 150],
            [1 => 120, 2 => 240],
            [1 => 200, 2 => 380],
        ];

        // DTDC covers only North India (zone3)
        $dtdc_prices = [
            // zone3 (North)
            [3 => 125],
            [3 => 200],
            [3 => 320],
            [3 => 500],
        ];

        // ST Courier ranges
        foreach ($ranges as $i => $range) {
            $rangeId = DB::table('carrier_ranges')->insertGetId([
                'carrier_id'   => 1,
                'billing_type' => 'weight_based',
                'delimiter1'   => $range['d1'],
                'delimiter2'   => $range['d2'],
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
            foreach ($st_prices[$i] as $zoneId => $price) {
                DB::table('carrier_range_prices')->insert([
                    'carrier_range_id' => $rangeId,
                    'zone_id'          => $zoneId,
                    'price'            => $price,
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);
            }
        }

        // DTDC ranges
        foreach ($ranges as $i => $range) {
            $rangeId = DB::table('carrier_ranges')->insertGetId([
                'carrier_id'   => 2,
                'billing_type' => 'weight_based',
                'delimiter1'   => $range['d1'],
                'delimiter2'   => $range['d2'],
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
            foreach ($dtdc_prices[$i] as $zoneId => $price) {
                DB::table('carrier_range_prices')->insert([
                    'carrier_range_id' => $rangeId,
                    'zone_id'          => $zoneId,
                    'price'            => $price,
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);
            }
        }

        // ── 8. Set shipping type to carrier_wise_shipping ─────────
        DB::table('business_settings')
            ->updateOrInsert(
                ['type' => 'shipping_type'],
                ['value' => 'carrier_wise_shipping', 'updated_at' => $now]
            );
    }

    public function down(): void
    {
        DB::table('carrier_range_prices')->truncate();
        DB::table('carrier_ranges')->truncate();
        DB::table('carriers')->truncate();
        DB::table('cities')->truncate();
        DB::table('states')->truncate();
        DB::table('countries')->truncate();
        DB::table('zones')->truncate();

        DB::table('business_settings')
            ->where('type', 'shipping_type')
            ->update(['value' => 'product_wise_shipping']);

        if (Schema::hasColumn('states', 'zone_id')) {
            Schema::table('states', function (Blueprint $table) {
                $table->dropColumn('zone_id');
            });
        }
    }
};
