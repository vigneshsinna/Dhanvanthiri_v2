<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestCheckoutSession extends Model
{
    public const STATUS_INITIATED = 'initiated';
    public const STATUS_VALIDATED = 'validated';
    public const STATUS_CART_BOUND = 'cart_bound';
    public const STATUS_PAYMENT_PENDING = 'payment_pending';
    public const STATUS_PAYMENT_AUTHORIZED = 'payment_authorized';
    public const STATUS_ORDER_COMPLETED = 'order_completed';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_ABANDONED = 'abandoned';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'guest_user_id',
        'temp_user_id',
        'guest_checkout_token_hash',
        'status',
        'combined_order_id',
        'order_code',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function guestUser()
    {
        return $this->belongsTo(User::class, 'guest_user_id');
    }
}
