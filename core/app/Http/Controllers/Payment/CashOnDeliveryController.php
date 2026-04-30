<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;

class CashOnDeliveryController extends Controller
{
    public function pay()
    {
        flash(translate("Your order has been placed successfully"))->success();
        return redirect(storefront_url('checkout/confirmation?combined_order_id=' . session('combined_order_id')));
    }
}
