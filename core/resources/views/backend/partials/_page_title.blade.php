{{--
    Page Title Partial — VISUAL-01
    Usage: @include('backend.partials._page_title', [
        'title' => 'All Orders',
        'action_url' => route('products.create'),
        'action_label' => 'Add New Product',
    ])
    All params optional except 'title'.
--}}
<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col">
            <h2 class="page-title">{{ translate($title) }}</h2>
        </div>
        @isset($action_url)
            <div class="col-auto">
                <a href="{{ $action_url }}" class="btn btn-primary">
                    <i class="las la-plus mr-1"></i>{{ translate($action_label ?? 'Add New') }}
                </a>
            </div>
        @endisset
    </div>
</div>
