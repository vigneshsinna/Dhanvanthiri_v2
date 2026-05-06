<?php

namespace App\Support;

class BusinessContact
{
    public static function details(): array
    {
        $admin = function_exists('get_admin') ? get_admin() : null;

        return [
            'name' => self::setting('site_name', config('app.name')),
            'email' => self::setting('contact_email', $admin?->email ?? env('MAIL_FROM_ADDRESS')),
            'phone' => self::setting('contact_phone', ''),
            'address' => self::setting('contact_address', ''),
        ];
    }

    public static function email(): ?string
    {
        $email = self::details()['email'] ?? null;

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    private static function setting(string $key, $default = null)
    {
        if (function_exists('get_setting')) {
            $value = get_setting($key);
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return $default;
    }
}
