<?php

namespace Tests\Feature\Admin;

use App\Mail\InvoiceEmailManager;
use App\Models\EmailTemplate;
use App\Models\Order;
use App\Models\User;
use App\Utility\EmailUtility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderConfirmationEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_confirmation_email_is_queued_to_the_customer(): void
    {
        Mail::fake();

        $customer = new User();
        $customer->forceFill([
            'name' => 'James',
            'email' => 'james@example.test',
            'password' => bcrypt('password'),
            'user_type' => 'customer',
            'email_verified_at' => now(),
        ]);
        $customer->save();

        $order = new Order();
        $order->forceFill([
            'user_id' => $customer->id,
            'seller_id' => $customer->id,
            'grand_total' => 228.00,
            'payment_status' => 'paid',
            'delivery_status' => 'pending',
            'payment_type' => 'razorpay',
            'code' => 'CONFIRM-001',
            'shipping_address' => json_encode([
                'name' => 'James',
                'email' => 'james@example.test',
                'phone' => '9999999999',
                'address' => 'Test Street',
                'city' => 'Chennai',
                'country' => 'India',
            ]),
        ]);
        $order->save();

        $template = new EmailTemplate();
        $template->forceFill([
            'identifier' => 'order_confirmation_email_to_customer',
            'name' => 'Order Confirmation',
            'email_type' => 'Order Confirmation',
            'subject' => 'Order Confirmation - [[order_number]]',
            'default_text' => 'Dear [[customer_name]], order [[order_number]] total [[order_amount]]. [[order_items]]',
            'status' => 1,
        ]);
        $template->save();

        EmailUtility::order_confirmation_email($order);

        Mail::assertQueued(InvoiceEmailManager::class, function (InvoiceEmailManager $mail) use ($order) {
            return $mail->hasTo('james@example.test')
                && $mail->array['view'] === 'emails.order_confirmation'
                && $mail->array['order']->is($order)
                && str_contains($mail->array['subject'], $order->code);
        });
    }
}
