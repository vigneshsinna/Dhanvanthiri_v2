<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\Language;
use App\Models\Order;
use App\Support\BusinessContact;
use Session;
use PDF;
use Config;

class InvoiceController extends Controller
{
    //download invoice
    public function invoice_download($id)
    {
        $order = $this->findOrder($id);
        if (!$order) {
            abort(404);
        }

        if (!$this->authorizeOrderAccess($order)) {
            flash(translate("You do not have the right permission to access this invoice."))->error();
            return redirect(storefront_url());
        }

        $config = ['mode' => 'utf-8', 'format' => 'A4-L', 'orientation' => 'L'];
        $font_family = "'Roboto', sans-serif";

        $language_code = Session::get('locale', Config::get('app.locale'));
        $language = Language::where('code', $language_code)->first()
            ?? Language::where('code', Config::get('app.locale'))->first()
            ?? Language::query()->first();

        $direction = (($language?->rtl ?? 0) == 1) ? 'rtl' : 'ltr';
        $text_align = $direction == 'rtl' ? 'right' : 'left';
        $not_text_align = $direction == 'rtl' ? 'left' : 'right';

        return PDF::loadView('backend.invoices.invoice', [
            'order' => $order,
            'font_family' => $font_family,
            'direction' => $direction,
            'text_align' => $text_align,
            'not_text_align' => $not_text_align,
            'businessContact' => BusinessContact::details(),
        ], [], $config)->download('order-' . $order->code . '.pdf');
    }

    public function invoice_print($id)
    {
        $order = $this->findOrder($id);
        if (!$order) {
            abort(404);
        }

        if (!$this->authorizeOrderAccess($order)) {
            flash(translate("You do not have the right permission to access this invoice."))->error();
            return redirect(storefront_url());
        }

        $language_code = Session::get('locale', Config::get('app.locale'));
        $language = Language::where('code', $language_code)->first()
            ?? Language::where('code', Config::get('app.locale'))->first()
            ?? Language::query()->first();
        $direction = (($language?->rtl ?? 0) == 1) ? 'rtl' : 'ltr';
        $text_align = $direction == 'rtl' ? 'right' : 'left';
        $not_text_align = $direction == 'rtl' ? 'left' : 'right';

        return view('backend.invoices.invoice', [
            'order' => $order,
            'font_family' => "'Roboto', sans-serif",
            'direction' => $direction,
            'text_align' => $text_align,
            'not_text_align' => $not_text_align,
            'businessContact' => BusinessContact::details(),
        ]);
    }

    protected function findOrder($id)
    {
        $order = Order::find($id);
        if (!$order) {
            $order = Order::where('combined_order_id', $id)->first();
        }
        return $order;
    }

    protected function authorizeOrderAccess(Order $order): bool
    {
        $user = auth('sanctum')->user() ?? auth()->user();
        $userType = $user?->user_type;
        $userId = $user?->id;

        // 1) Admin/Staff Access
        if ($user && in_array($userType, ['admin', 'staff', 'super_admin'], true)) {
            return true;
        }

        // 2) Registered User Ownership
        if ($userId && in_array($userId, [$order->user_id, $order->seller_id])) {
            return true;
        }

        // 3) Secure Guest Access Check
        $guestToken = request()->header('X-Cart-Token') ?? request()->query('guest_token');
        if ($guestToken) {
            $tokenHash = hash('sha256', $guestToken);
            $session = \App\Models\GuestCheckoutSession::where('guest_checkout_token_hash', $tokenHash)
                ->where(function($q) use ($order) {
                    $q->where('combined_order_id', $order->combined_order_id)
                      ->orWhere('order_code', $order->code);
                })
                ->first();

            if ($session) {
                return true;
            }
        }

        return false;
    }


}
