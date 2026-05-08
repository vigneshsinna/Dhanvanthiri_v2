<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dhanvanthiri Foods — Authentic South Indian Pickles & Thokku</title>
    
    <link rel="icon" href="{{ static_asset('favicon.avif') }}">
    <link rel="apple-touch-icon" href="{{ static_asset('favicon.avif') }}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

    @if (app()->environment('local'))
        {{-- Vite Dev Server Development Links --}}
        <script type="module">
            import RefreshRuntime from 'http://localhost:5173/@react-refresh'
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
        </script>
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/src/main.tsx"></script>
    @else
        {{-- Production Assets --}}
        {{-- Note: In production, ensure manifest.json is parsed or assets are copied to public/ --}}
        <link rel="stylesheet" href="{{ static_asset('frontend/assets/index.css') }}">
        <script type="module" src="{{ static_asset('frontend/assets/index.js') }}"></script>
    @endif
</head>
<body class="bg-stone-50 font-sans antialiased">
    <div id="root"></div>
    
    <script>
        window.Laravel = {
            csrfToken: '{{ csrf_token() }}',
            baseUrl: '{{ url('/') }}',
            apiUrl: '{{ url('/api/v2') }}'
        };
    </script>
</body>
</html>
