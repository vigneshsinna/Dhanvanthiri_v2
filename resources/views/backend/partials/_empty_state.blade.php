{{-- 
    Empty State Partial — FEEDBACK-03
    Usage: @include('backend.partials._empty_state', ['message' => 'No orders found.'])
    Optional: @include('backend.partials._empty_state', ['message' => '...', 'icon' => 'la-box-open'])
--}}
<tr>
    <td colspan="100%" class="text-center py-5">
        <div class="py-4">
            <i class="las {{ $icon ?? 'la-inbox' }} fs-48 text-muted opacity-50 d-block mb-3"></i>
            <p class="fs-14 text-muted mb-0">{{ translate($message ?? 'No data found.') }}</p>
            @isset($action_url)
                <a href="{{ $action_url }}" class="btn btn-sm btn-primary mt-3">
                    <i class="las la-plus mr-1"></i>{{ translate($action_label ?? 'Add New') }}
                </a>
            @endisset
        </div>
    </td>
</tr>
