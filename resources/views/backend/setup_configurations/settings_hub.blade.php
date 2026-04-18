@extends('backend.layouts.app')

@section('breadcrumb')
    @include('backend.partials._breadcrumb', ['items' => [
        ['label' => 'Home', 'url' => route('admin.dashboard')],
        ['label' => 'Settings'],
    ]])
@endsection

@section('content')

<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col">
            <h2 class="page-title">{{ translate('Settings') }}</h2>
        </div>
    </div>
</div>

<div class="row gutters-10">
    {{-- General --}}
    @canany(['general_settings', 'business_settings', 'features_activation'])
    <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-header"><h5 class="mb-0 h6"><i class="las la-cog mr-2"></i>{{ translate('General') }}</h5></div>
            <div class="list-group list-group-flush">
                @can('general_settings')
                    <a href="{{ route('general_setting.index') }}" class="list-group-item list-group-item-action">{{ translate('General Settings') }}</a>
                @endcan
                @can('business_settings')
                    <a href="{{ route('business_settings.index') }}" class="list-group-item list-group-item-action">{{ translate('Business Settings') }}</a>
                @endcan
                @can('features_activation')
                    <a href="{{ route('activation.index') }}" class="list-group-item list-group-item-action">{{ translate('Features Activation') }}</a>
                @endcan
            </div>
        </div>
    </div>
    @endcanany

    {{-- Localization --}}
    @canany(['language_setup', 'currency_setup', 'vat_&_tax_setup'])
    <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-header"><h5 class="mb-0 h6"><i class="las la-globe mr-2"></i>{{ translate('Localization') }}</h5></div>
            <div class="list-group list-group-flush">
                @can('language_setup')
                    <a href="{{ route('languages.index') }}" class="list-group-item list-group-item-action">{{ translate('Languages') }}</a>
                @endcan
                @can('currency_setup')
                    <a href="{{ route('currency.index') }}" class="list-group-item list-group-item-action">{{ translate('Currency') }}</a>
                @endcan
                @can('vat_&_tax_setup')
                    <a href="{{ route('tax.index') }}" class="list-group-item list-group-item-action">{{ translate('VAT & Tax') }}</a>
                @endcan
            </div>
        </div>
    </div>
    @endcanany

    {{-- Payment & Shipping --}}
    @canany(['payment_methods_configurations', 'shipping_configuration', 'order_configuration', 'pickup_point_setup', 'select_shipping_methods'])
    <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-header"><h5 class="mb-0 h6"><i class="las la-credit-card mr-2"></i>{{ translate('Payment & Shipping') }}</h5></div>
            <div class="list-group list-group-flush">
                @can('payment_methods_configurations')
                    <a href="{{ route('payment_method.index') }}" class="list-group-item list-group-item-action">{{ translate('Payment Methods') }}</a>
                @endcan
                @can('shipping_configuration')
                    <a href="{{ route('shipping_configuration.index') }}" class="list-group-item list-group-item-action">{{ translate('Shipping Configuration') }}</a>
                @endcan
                @can('select_shipping_methods')
                    <a href="{{ route('shipping_configuration.shipping_method') }}" class="list-group-item list-group-item-action">{{ translate('Shipping Methods') }}</a>
                @endcan
                @can('order_configuration')
                    <a href="{{ route('order_configuration.index') }}" class="list-group-item list-group-item-action">{{ translate('Order Configuration') }}</a>
                @endcan
                @can('pickup_point_setup')
                    <a href="{{ route('pick_up_points.index') }}" class="list-group-item list-group-item-action">{{ translate('Pickup Points') }}</a>
                @endcan
            </div>
        </div>
    </div>
    @endcanany

    {{-- Email & Notifications --}}
    @canany(['smtp_settings'])
    <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-header"><h5 class="mb-0 h6"><i class="las la-envelope mr-2"></i>{{ translate('Email & Notifications') }}</h5></div>
            <div class="list-group list-group-flush">
                @can('smtp_settings')
                    <a href="{{ route('smtp_settings.index') }}" class="list-group-item list-group-item-action">{{ translate('SMTP Settings') }}</a>
                @endcan
            </div>
        </div>
    </div>
    @endcanany

    {{-- Integrations --}}
    @canany(['social_media_logins', 'facebook_chat', 'facebook_comment', 'analytics_tools_configuration', 'google_recaptcha_configuration', 'google_map_setting', 'google_firebase_setting', 'whatsapp_chat'])
    <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-header"><h5 class="mb-0 h6"><i class="las la-plug mr-2"></i>{{ translate('Integrations') }}</h5></div>
            <div class="list-group list-group-flush">
                @can('social_media_logins')
                    <a href="{{ route('social_login.index') }}" class="list-group-item list-group-item-action">{{ translate('Social Media Logins') }}</a>
                @endcan
                @can('analytics_tools_configuration')
                    <a href="{{ route('google_analytics.index') }}" class="list-group-item list-group-item-action">{{ translate('Google Analytics') }}</a>
                @endcan
                @can('google_recaptcha_configuration')
                    <a href="{{ route('google_recaptcha.index') }}" class="list-group-item list-group-item-action">{{ translate('Google reCAPTCHA') }}</a>
                @endcan
                @can('google_map_setting')
                    <a href="{{ route('google-map.index') }}" class="list-group-item list-group-item-action">{{ translate('Google Map') }}</a>
                @endcan
                @can('google_firebase_setting')
                    <a href="{{ route('google-firebase.index') }}" class="list-group-item list-group-item-action">{{ translate('Google Firebase') }}</a>
                @endcan
                @can('whatsapp_chat')
                    <a href="{{ route('whatsapp_chat.index') }}" class="list-group-item list-group-item-action">{{ translate('WhatsApp Chat') }}</a>
                @endcan
                @can('facebook_comment')
                    <a href="{{ route('facebook-comment') }}" class="list-group-item list-group-item-action">{{ translate('Facebook Comment') }}</a>
                @endcan
            </div>
        </div>
    </div>
    @endcanany

    {{-- System --}}
    @canany(['file_system_&_cache_configuration'])
    <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-header"><h5 class="mb-0 h6"><i class="las la-server mr-2"></i>{{ translate('System') }}</h5></div>
            <div class="list-group list-group-flush">
                @can('file_system_&_cache_configuration')
                    <a href="{{ route('file_system.index') }}" class="list-group-item list-group-item-action">{{ translate('File System & Cache') }}</a>
                @endcan
            </div>
        </div>
    </div>
    @endcanany
</div>

@endsection
