{{--
    Breadcrumb Partial — NAV-03
    Usage: @section('breadcrumb')
               @include('backend.partials._breadcrumb', ['items' => [
                   ['label' => 'Home', 'url' => route('admin.dashboard')],
                   ['label' => 'Orders', 'url' => route('all_orders.index')],
                   ['label' => '#ORD-1234'],
               ]])
           @endsection
--}}
<nav aria-label="{{ translate('Breadcrumb') }}" class="mb-0">
    <ol class="breadcrumb bg-transparent p-0 mb-0 fs-12">
        @foreach ($items as $i => $item)
            @if ($loop->last)
                <li class="breadcrumb-item active text-truncate" aria-current="page" style="max-width: 200px;">
                    {{ translate($item['label']) }}
                </li>
            @else
                <li class="breadcrumb-item">
                    <a href="{{ $item['url'] ?? '#' }}" class="text-muted">{{ translate($item['label']) }}</a>
                </li>
            @endif
        @endforeach
    </ol>
</nav>
