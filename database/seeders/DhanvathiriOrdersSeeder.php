<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DhanvathiriOrdersSeeder extends Seeder
{
    public function run()
    {
        // Clear existing order data
        DB::table('order_details')->truncate();
        DB::table('orders')->truncate();
        DB::table('combined_orders')->truncate();

        // Also clear and create sample customer users
        DB::table('users')->where('user_type', 'customer')->delete();

        $customers = [];
        $customerNames = [
            'Priya Ramesh', 'Anand Kumar', 'Meena Sundaram', 'Vijay Krishnan',
            'Lakshmi Devi', 'Suresh Babu', 'Kavitha Rajan', 'Murali Doss',
            'Sangeetha Nair', 'Rajesh Pillai',
        ];

        foreach ($customerNames as $i => $name) {
            $parts = explode(' ', $name);
            $email = strtolower($parts[0]) . '.' . strtolower($parts[1]) . '@example.com';
            $customerId = DB::table('users')->insertGetId([
                'name'               => $name,
                'email'              => $email,
                'password'           => bcrypt('Customer@123'),
                'user_type'          => 'customer',
                'email_verified_at'  => now()->subDays(rand(30, 120)),
                'phone'              => '9' . rand(100000000, 999999999),
                'referral_code'      => Str::random(10),
                'remaining_uploads'  => 0,
                'created_at'         => now()->subDays(rand(10, 90)),
                'updated_at'         => now(),
            ]);
            $customers[] = $customerId;
        }

        // Get all products
        $products = DB::table('products')->select('id', 'unit_price', 'category_id')->get()->toArray();

        if (empty($products)) {
            $this->command->warn('No products found. Run DhanvathiriProductsSeeder first.');
            return;
        }

        $paymentMethods = ['cash_on_delivery', 'razorpay', 'upi', 'bank_transfer'];
        $deliveryStatuses = ['delivered', 'delivered', 'delivered', 'shipped', 'pending', 'pending'];
        $shippingAddresses = [
            '12, Gandhi Nagar, Chennai - 600020',
            '45, Anna Salai, Coimbatore - 641001',
            '78, MG Road, Bengaluru - 560001',
            '23, T Nagar, Chennai - 600017',
            '56, Pondy Bazaar, Chennai - 600006',
            '90, RS Puram, Coimbatore - 641002',
            '34, Velachery Main Road, Chennai - 600042',
            '67, Adyar, Chennai - 600020',
            '11, KK Nagar, Chennai - 600078',
            '89, Tambaram, Chennai - 600045',
        ];

        // Generate 35 sample orders spread over the past 4 months
        $orderCount = 35;
        for ($i = 0; $i < $orderCount; $i++) {
            $daysAgo     = rand(1, 120);
            $orderDate   = now()->subDays($daysAgo);
            $customerId  = $customers[array_rand($customers)];
            $payMethod   = $paymentMethods[array_rand($paymentMethods)];
            $delivStatus = $deliveryStatuses[array_rand($deliveryStatuses)];
            $payStatus   = ($delivStatus === 'delivered') ? 'paid' : (rand(0, 1) ? 'paid' : 'unpaid');

            // Create combined order
            $combinedId = DB::table('combined_orders')->insertGetId([
                'user_id'     => $customerId,
                'grand_total' => 0, // will update after
                'created_at'  => $orderDate,
                'updated_at'  => $orderDate,
            ]);

            // Create the order
            $orderId = DB::table('orders')->insertGetId([
                'combined_order_id' => $combinedId,
                'user_id'           => $customerId,
                'seller_id'         => 1,
                'shipping_address'  => $shippingAddresses[array_rand($shippingAddresses)],
                'delivery_status'   => $delivStatus,
                'payment_type'      => $payMethod,
                'payment_status'    => $payStatus,
                'grand_total'       => 0, // will update
                'coupon_discount'   => 0,
                'code'              => 'ORD-' . strtoupper(Str::random(8)),
                'tracking_code'     => 'TRK' . rand(100000, 999999),
                'viewed'            => 1,
                'shipping_type'     => 'free',
                'created_at'        => $orderDate,
                'updated_at'        => $orderDate,
            ]);

            // Add 1-4 order detail items
            $numItems   = rand(1, 4);
            $orderTotal = 0;

            // Pick random products without repetition for this order
            $shuffled = $products;
            shuffle($shuffled);
            $selectedProducts = array_slice($shuffled, 0, min($numItems, count($shuffled)));

            foreach ($selectedProducts as $product) {
                $qty      = rand(1, 3);
                $price    = $product->unit_price;
                $subtotal = $price * $qty;
                $orderTotal += $subtotal;

                DB::table('order_details')->insert([
                    'order_id'        => $orderId,
                    'seller_id'       => 1,
                    'product_id'      => $product->id,
                    'variation'       => '',
                    'price'           => $price,
                    'tax'             => 0,
                    'shipping_cost'   => 0,
                    'quantity'        => $qty,
                    'payment_status'  => $payStatus,
                    'delivery_status' => $delivStatus,
                    'shipping_type'   => 'free',
                    'created_at'      => $orderDate,
                    'updated_at'      => $orderDate,
                ]);
            }

            // Update grand totals
            DB::table('orders')->where('id', $orderId)->update([
                'grand_total' => $orderTotal,
            ]);
            DB::table('combined_orders')->where('id', $combinedId)->update([
                'grand_total' => $orderTotal,
            ]);
        }

        $this->command->info('✓ Inserted ' . count($customers) . ' customers and ' . $orderCount . ' sample orders.');
    }
}
