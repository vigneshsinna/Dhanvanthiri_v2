<?php

namespace App\Http\Controllers\Api\V2;

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
            abort(403, translate('You do not have the right permission to access this invoice.'));
        }

        $default_currency = Currency::find(get_setting('system_default_currency')) ?? Currency::query()->first();
        $currency_code = request()->header('Currency-Code') ?: ($default_currency?->code ?? 'USD');
        $language_code = request()->header('App-Language');
        $language = Language::where('code', $language_code)->first()
            ?? Language::where('code', Config::get('app.locale'))->first()
            ?? Language::query()->first();

        if (($language?->rtl ?? 0) == 1) {
            $direction = 'rtl';
            $text_align = 'right';
            $not_text_align = 'left';
        } else {
            $direction = 'ltr';
            $text_align = 'left';
            $not_text_align = 'right';
        }

        if (
            $currency_code == 'BDT' ||
            $language_code == 'bd'
        ) {
            // bengali font
            $font_family = "'Hind Siliguri','sans-serif'";
        } elseif (
            $currency_code == 'KHR' ||
            $language_code == 'kh'
        ) {
            // khmer font
            $font_family = "'Hanuman','sans-serif'";
        } elseif ($currency_code == 'AMD') {
            // Armenia font
            $font_family = "'arnamu','sans-serif'";
            // }elseif($currency_code == 'ILS'){
            //     // Israeli font
            //     $font_family = "'Varela Round','sans-serif'";
        } elseif (
            $currency_code == 'AED' ||
            $currency_code == 'EGP' ||
            $language_code == 'sa' ||
            $currency_code == 'IQD' ||
            $language_code == 'ir' ||
            $language_code == 'om' ||
            $currency_code == 'ROM' ||
            $currency_code == 'SDG' ||
            $currency_code == 'ILS' ||
            $language_code == 'jo'
        ) {
            // middle east/arabic/Israeli font
            $font_family = "'Baloo Bhaijaan 2','sans-serif'";
        } elseif ($currency_code == 'THB') {
            // thai font
            $font_family = "'Kanit','sans-serif'";
        } elseif (
            $currency_code == 'CNY' ||
            $language_code == 'zh'
        ) {
            // Chinese font
            $font_family = "'yahei','sans-serif'";
        } elseif (
            $currency_code == 'kyat' ||
            $language_code == 'mm'
        ) {
            // Myanmar font
            $font_family = "'pyidaungsu','sans-serif'";
        } elseif (
            $currency_code == 'THB' ||
            $language_code == 'th'
        ) {
            // Thai font
            $font_family = "'zawgyi-one','sans-serif'";
        } elseif ($this->orderContainsTamil($order) && $this->tamilFontAvailable()) {
            $font_family = "'Noto Sans Tamil','Roboto',sans-serif";
        } else {
            // general for all
            $font_family = "'Roboto',sans-serif";
        }

        // $config = ['instanceConfigurator' => function($mpdf) {
        //     $mpdf->showImageErrors = true;
        // }];
        // mpdf config will be used in 4th params of loadview

        $config = $this->invoicePdfConfig($font_family);

        return PDF::loadView('backend.invoices.invoice', [
            'order' => $order,
            'font_family' => $font_family,
            'direction' => $direction,
            'text_align' => $text_align,
            'not_text_align' => $not_text_align,
            'businessContact' => BusinessContact::details(),
        ], [], $config)->download('order-' . $order->code . '.pdf');
    }

    protected function findOrder($id)
    {
        $order = Order::with(['user', 'orderDetails.product.stocks'])->find($id);
        if (!$order) {
            $order = Order::with(['user', 'orderDetails.product.stocks'])
                ->where('combined_order_id', $id)
                ->first();
        }

        return $order;
    }

    protected function orderContainsTamil(Order $order): bool
    {
        return $order->orderDetails->contains(function ($detail) {
            $product = $detail->product;
            if (!$product) {
                return false;
            }

            $names = collect([$product->name, $product->getTranslation('name')])
                ->merge($product->product_translations->pluck('name'));

            return $names->contains(fn ($name) => is_string($name) && preg_match('/\p{Tamil}/u', $name));
        });
    }

    protected function tamilFontAvailable(): bool
    {
        return is_file(base_path('public/fonts/NotoSansTamil-Regular.ttf'))
            || is_file(base_path('public/assets/fonts/NotoSansTamil-Regular.ttf'));
    }

    protected function invoicePdfConfig(string $fontFamily): array
    {
        if (!str_contains($fontFamily, 'Noto Sans Tamil')) {
            return [];
        }

        $fontPath = is_file(base_path('public/fonts/NotoSansTamil-Regular.ttf'))
            ? base_path('public/fonts/')
            : base_path('public/assets/fonts/');

        Config::set('pdf.font_path', $fontPath);
        Config::set('pdf.font_data', [
            'notosanstamil' => [
                'R' => 'NotoSansTamil-Regular.ttf',
                'B' => is_file($fontPath . 'NotoSansTamil-Bold.ttf') ? 'NotoSansTamil-Bold.ttf' : 'NotoSansTamil-Regular.ttf',
                'useOTL' => 0xFF,
                'useKashida' => 75,
            ],
        ]);

        return ['default_font' => 'notosanstamil'];
    }

    protected function authorizeOrderAccess(Order $order): bool
    {
        $user = auth('sanctum')->user() ?? auth()->user();
        $userType = $user?->user_type;
        $userId = $user?->id;

        if ($user && in_array($userType, ['admin', 'staff', 'super_admin'], true)) {
            return true;
        }

        if ($userId && in_array($userId, [$order->user_id, $order->seller_id], true)) {
            return true;
        }

        $guestToken = request()->header('X-Cart-Token') ?? request()->query('guest_token');
        if ($guestToken) {
            $tokenHash = hash('sha256', $guestToken);
            $session = \App\Models\GuestCheckoutSession::where('guest_checkout_token_hash', $tokenHash)
                ->where(function ($query) use ($order) {
                    $query->where('combined_order_id', $order->combined_order_id)
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
