@extends('backend.layouts.app')

@section('content')

<div class="aiz-titlebar text-left mt-2 mb-3">
    <div class="row align-items-center">
        <div class="col-auto">
            <h1 class="h3">{{ translate('Pending Sellers') }}</h1>
        </div>
    </div>
</div>

<div class="card">
    <form id="sort_sellers" action="" method="GET">
        <div class="card-header row gutters-5">
            <div class="col">
                <h5 class="mb-md-0 h6">{{ translate('Pending Seller List') }}</h5>
            </div>
            <div class="col-md-3 ml-auto">
                <input type="text" class="form-control" name="search" @isset($sort_search) value="{{ $sort_search }}" @endisset placeholder="{{ translate('Type name or email or mobile number & Enter') }}">
            </div>
        </div>

        <div class="card-body">
            <table class="table aiz-table mb-0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{{ translate('Name') }}</th>
                        <th>{{ translate('Phone') }}</th>
                        <th>{{ translate('Email') }}</th>
                        <th>{{ translate('Registration Date') }}</th>
                        <th data-breakpoints="lg">{{translate('Access Approval')}}</th>
                        <th>{{ translate('Status') }}</th>
                        <th>{{ translate('Action') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($shops as $key => $shop)
                        <tr>
                            <td>{{ ($key + 1) + ($shops->currentPage() - 1) * $shops->perPage() }}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="{{ uploaded_asset($shop->logo) }}" class="size-40px img-fit mr-2" onerror="this.onerror=null;this.src='{{ static_asset('assets/img/placeholder.jpg') }}';">
                                    <span class="text-truncate-2">{{ $shop->name }}</span>
                                </div>
                            </td>
                            <td>{{ $shop->user->phone ?? '-' }}</td>
                            <td>{{ $shop->user->email ?? '-' }}</td>
                            <td>{{ $shop->created_at ? $shop->created_at->format('Y-m-d H:i:s') : '-' }}</td>
                            <td>
                                <label class="aiz-switch aiz-switch-success mb-0">
                                    <input
                                        @can('approve_seller') onchange="update_approved(this)" @endcan
                                        value="{{ $shop->id }}" type="checkbox"
                                        <?php if($shop->registration_approval == 1) echo "checked";?>
                                        @cannot('approve_seller') disabled @endcan
                                    >
                                    <span class="slider round"></span>
                                </label>
                            </td>
                            
                            <td><span class="badge badge-inline badge-warning">{{ translate('Pending') }}</span></td>
                            <td>
                                @can('delete_seller')
                                    <a href="javascript:void();" class="badge badge-inline badge-danger confirm-delete" data-href="{{route('sellers.destroy', $shop->id)}}">
                                        {{translate('Delete')}}
                                    </a>
                                @endcan
                            </td>
                
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="aiz-pagination">
                {{ $shops->appends(request()->input())->links() }}
            </div>
        </div>
    </form>
</div>

@endsection

@section('modal')
    @include('modals.delete_modal')

@endsection

@section('script')
<script>
   function update_approved(el){
        if ('{{ env('DEMO_MODE') }}' === 'On') {
            AIZ.plugins.notify('info', '{{ translate('Data can not change in demo mode.') }}');
            return;
        }
        let registration_approval = el.checked ? 1 : 0;
        let shop_id = el.value;
        let $row = $(el).closest('tr');

        $.post('{{ route('sellers.registration.approved') }}', {
            _token: '{{ csrf_token() }}',
            id: shop_id,
            registration_approval: registration_approval
        }, function (data) {
            if (data == 1) {
                AIZ.plugins.notify('success', '{{ translate('Pending sellers Approved successfully') }}');
                if (registration_approval === 1) {
                    $row.fadeOut(300, function() {
                        $(this).remove();
                    });
                }
            } else {
                AIZ.plugins.notify('danger', '{{ translate('Something went wrong') }}');
            }
        });
    }
</script>
@endsection
