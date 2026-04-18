<div class="card-body">
    <table class="table aiz-table mb-0" id="aiz-data-table">
         <thead>
            <tr>
                @if (auth()->user()->can('product_delete'))
                    <th>
                        <div class="form-group">
                            <div class="aiz-checkbox-inline">
                                <label class="aiz-checkbox pt-5px d-block">
                                    <input type="checkbox" class="check-all">
                                    <span class="aiz-square-check"></span>
                                </label>
                            </div>
                        </div>
                    </th>
                @else
                <th class="hide-lg">#</th>
                @endif
                <th class="text-uppercase fs-10 fs-md-12 fw-700 text-secondary">{{ translate('Thumb') }}</th>
                <th class="text-uppercase fs-10 fs-md-12 fw-700 text-secondary ml-1 ml-lg-0">{{ translate('Name / Brand') }}</th>

                <th class="d-none d-sm-table-cell text-uppercase fs-10 fs-md-12 fw-700 text-secondary">{{ translate('Owner / Category') }}</th>
                <th class="d-none d-md-table-cell text-uppercase fs-12 fw-700 text-secondary">{{ translate('Ratings') }}</th>
                <th class="d-none d-lg-table-cell text-uppercase fs-12 fw-700 text-secondary"> {{ translate('Price') }}
                </th>

                <th class="d-none d-xl-table-cell text-uppercase fs-12 fw-700 text-secondary">{{ translate('Stock') }}</th>
                <th class="d-none d-lg-table-cell text-uppercase fs-12 fw-700 text-secondary">
                    <span data-toggle="tooltip" title="{{ translate('Published') }}">{{ translate('Pub') }}</span> /
                    <span data-toggle="tooltip" title="{{ translate('Featured') }}">{{ translate('Feat') }}</span> /
                    <span data-toggle="tooltip" title="{{ translate('Todays Deal') }}">{{ translate('Deal') }}</span>
                </th>

                <th class="text-right text-uppercase fs-10 fs-md-12 fw-700 text-secondary">{{ translate('Options') }}</th>
            </tr>
        </thead>

        <tbody>
            <!-- ROW  -->
            @foreach ($products as $key => $product)
            <tr class="data-row">
                
                <td class="align-middle w-40px">
                    <div>
                        <button type="button"
                            class="toggle-plus-minus-btn border-0 bg-blue fs-14 fw-500 text-white p-0 align-items-center justify-content-center">+</button>
                    </div>
                    @if (auth()->user()->can('product_delete'))
                    <div class="form-group d-inline-block">
                        <label class="aiz-checkbox">
                            <input type="checkbox" class="check-one" name="id[]" value="{{ $product->id }}">
                            <span class="aiz-square-check"></span>
                        </label>
                    </div>
                    @else
                    <div class="form-group d-inline-block">{{ $key + 1 + ($products->currentPage() - 1) * $products->perPage() }}</div>
                    @endif
                </td>
               

                
                <td data-label="Thumb" class="w-60px w-md-80px w-md-100px">
                    <div class="w-40px h-40px w-sm-60px h-sm-60px w-md-80px h-md-80px rounded-2 overflow-hidden border">
                        <img src="{{ uploaded_asset($product->thumbnail_img) }}" alt="Image" class="img-fit">
                    </div>

                </td>
                <td data-label="Name" class="w-lg-300px">
                    <div class="row gutters-5 w-sm-180px w-md-200px w-lg-100 mw-100 ml-1 ml-lg-0">
                        <div class="col">
                            <span class="text-truncate-2 fs-12 fs-md-14 fw-400 mr-2">{{ $product->getTranslation('name') }}</span>
                            @if(isset($product->brand->name))
                                <a href="{{ route('products.all', ['brand_id' => $product->brand->id, 'brand_name' => $product->brand->name]) }}" class="fs-12 fs-md-14 fw-700 d-inline-block mt-1">
                                    {{ translate($product->brand->name) }}
                                </a>
                            @else
                                <span class="fs-12 fs-md-14 fw-700 d-inline-block mt-1 text-secondary">{{ translate('No Brand') }}</span>
                            @endif

                        </div>
                    </div>
                </td>
                <td class="d-none d-sm-table-cell" data-label="Owner Category">
                     @php $shop = optional(optional($product->user)->shop); @endphp
                    <a href="{{ $shop->id ? route('sellers.profile', encrypt($shop->id)) : '#' }}" class="fs-12 fs-md-14 fw-700 d-block">
                         {{ $shop->name ?? translate('Inhouse') }}
                    </a>
                    <span class="fs-12 fw-200 text-secondary d-block pt-1">{{ translate('Main Category') }}</span>
                    <p class="fs-12 fs-md-14 fw-700 m-0">{{ translate(optional($product->main_category)->name ?? '') }}</p> 
                </td>
                <td class="d-none d-md-table-cell" data-label="Ratings">
                    <!--Ratting-->
                    <div class="d-flex align-items-center rattings">
                        <span class="rating rating-mr-1">
                            {{ renderStarRatingLatest($product->rating) }}
                        </span>
                    </div>
                    <p class="fs-14 m-0 py-1"><span class="fw-700">{{ $product->rating }}</span><span class="px-1">{{ translate('out of') }}</span>
                        <span>5.0</span>
                    </p>
                    @php
                        $total = 0;
                        $total += $product->reviews->where('status', 1)->count();
                    @endphp

                    <p class="fs-14 fw-400 text-secondary m-0">
                        <span class="mr-1">{{ $total }}</span>{{translate('Reviews') }}
                    </p>
                </td>

                <td class="d-none d-lg-table-cell align-middle" data-label="Price">
                    <div class="quick-edit-container border-width-3 border-left border-blue px-2 py-0 mb-1" onclick="enableQuickEdit(this, 'price', {{ $product->id }})">
                        <span class="text-secondary fs-10 fw-400 text-uppercase d-block">{{ translate('Base Price') }}</span>
                        <div class="d-flex align-items-center">
                            <span class="fs-16 fw-700 m-0 display-value text-dark">{{ single_price($product->unit_price) }}</span>
                            <input type="number" step="0.01" class="form-control form-control-xs edit-input d-none" value="{{ $product->unit_price }}" onblur="saveQuickEdit(this, 'price', {{ $product->id }})" onkeyup="handleQuickEditKey(event, this, 'price', {{ $product->id }})">
                            <i class="las la-edit ml-2 text-muted edit-icon fs-12"></i>
                        </div>
                    </div>
                    @if (discount_in_percentage($product) > 0)
                    <div class="border-width-3  border-left border-danger px-2 py-0">
                        <p class="fs-12 fw-400 m-0">{{ translate('Discount') }}
                            <span class="text-danger fw-700 pl-1">{{ discount_in_percentage($product) }}%</span>
                        </p>
                    </div>
                    @endif
                </td>
                <td class="d-none d-xl-table-cell" data-label="Stock">
                    <div class="mb-2">
                        <span class="fs-10 fw-400 text-secondary text-uppercase d-block">{{ translate('Stock Status') }}</span>
                        <div class="quick-edit-container d-flex align-items-center mt-1" onclick="enableQuickEdit(this, 'stock', {{ $product->id }})">
                            <span class="fs-15 fw-700 m-0 display-value {{ $product->current_stock <= $product->low_stock_quantity ? 'text-danger' : 'text-success' }}">
                                {{ $product->current_stock }} {{ $product->unit }}
                            </span>
                            <input type="number" class="form-control form-control-xs edit-input d-none h-25px" value="{{ $product->current_stock }}" onblur="saveQuickEdit(this, 'stock', {{ $product->id }})" onkeyup="handleQuickEditKey(event, this, 'stock', {{ $product->id }})">
                            <i class="las la-edit ml-2 text-muted edit-icon fs-12"></i>
                        </div>
                    </div>
                    @if(!$product->draft && !$product->digital)
                    <a href="javascript:void(0)" onclick='openRightcanvas({{ $product->id }}, "{{ addslashes($product->getTranslation('name')) }}" )'
                        class="fs-12 fw-600 text-blue td-see-more"><i class="las la-history mr-1"></i>{{translate('Detailed Stock')}}</a>
                    @endif
                </td>
                        
                <td class="d-none d-lg-table-cell align-middle" data-label="Status">
                    <div class="d-flex flex-wrap" style="gap: 10px; min-width: 120px;">
                        @if (!$product->draft)
                            {{-- Published --}}
                            <div class="status-indicator">
                                <label class="aiz-switch aiz-switch-blue mb-0" data-toggle="tooltip" title="{{ translate('Published Status') }}">
                                    <input onchange="update_published(this)" value="{{ $product->id }}" type="checkbox" {{ $product->published == 1 ? 'checked' : '' }}>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            
                            {{-- Featured --}}
                            <div class="status-indicator">
                                <label class="aiz-switch aiz-switch-success mb-0" data-toggle="tooltip" title="{{ translate('Featured Status') }}">
                                    <input onchange="update_featured(this)" value="{{ $product->id }}" type="checkbox" {{ $product->featured == 1 ? 'checked' : '' }}>
                                    <span class="slider round"></span>
                                </label>
                            </div>

                            {{-- Todays Deal --}}
                            <div class="status-indicator">
                                <label class="aiz-switch aiz-switch-warning mb-0" data-toggle="tooltip" title="{{ translate('Today\'s Deal') }}">
                                    <input onchange="update_todays_deal(this)" value="{{ $product->id }}" type="checkbox" {{ $product->todays_deal == 1 ? 'checked' : '' }}>
                                    <span class="slider round"></span>
                                </label>
                            </div>

                            @if (get_setting('product_approve_by_admin') == 1 && $type == 'seller')
                                <div class="status-indicator">
                                    <label class="aiz-switch aiz-switch-info mb-0" data-toggle="tooltip" title="{{ translate('Admin Approval') }}">
                                        <input onchange="update_approved(this)" value="{{ $product->id }}" type="checkbox" {{ $product->approved == 1 ? 'checked' : '' }}>
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            @endif
                        @else
                            <span class="badge badge-inline badge-soft-danger uppercase fs-10 fw-700 p-2">{{ translate('Draft') }}</span>
                        @endif
                    </div>
                </td>

                <td class="text-right align-middle">
                    <div class="d-flex align-items-center justify-content-end table-actions">
                        <!--View Product-->
                        @if(!$product->draft)
                        <a href="{{ storefront_url('/products/' . $product->slug) }}" target="_blank"
                            class="btn btn-soft-primary btn-icon btn-circle btn-sm hov-svg-white mr-2" 
                            title="{{ translate('View on Storefront') }}" data-toggle="tooltip">
                            <i class="las la-eye fs-16"></i>
                        </a>
                        @endif

                        <!--Edit-->
                        @if(auth()->user()->can('product_edit'))
                        <a href="@if ($type == 'seller'){{ route('products.seller.edit', ['id' => $product->id, 'lang' => env('DEFAULT_LANGUAGE')]) }}@else{{ route('products.admin.edit', ['id' => $product->id, 'lang' => env('DEFAULT_LANGUAGE')]) }}@endif"
                            class="btn btn-soft-success btn-icon btn-circle btn-sm hov-svg-white mr-2"
                            title="{{ translate('Edit Product') }}" data-toggle="tooltip">
                            <i class="las la-edit fs-16"></i>
                        </a>
                        @endif

                        <!--Delete-->
                        @if(auth()->user()->can('product_delete'))
                        <a href="javascript:void(0)" onclick="singleDelete({{ $product->id }})"
                            class="btn btn-soft-danger btn-icon btn-circle btn-sm hov-svg-white mr-2"
                            title="{{ translate('Delete') }}" data-toggle="tooltip">
                            <i class="las la-trash fs-16"></i>
                        </a>
                        @endif

                        <!-- More Menu (Clone, Download, etc) -->
                        <div class="dropdown">
                            <button class="btn btn-light btn-icon btn-circle btn-sm d-flex align-items-center justify-content-center p-0" type="button"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-boundary="viewport" title="{{ translate('More Options') }}" data-toggle="tooltip">
                                <i class="las la-ellipsis-v fs-16"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-right dropdown-menu-xs p-2 shadow-lg" style="min-width: 160px; z-index: 1040;">
                                <!-- Clone/Duplicate -->
                                @if(auth()->user()->can('product_duplicate'))
                                <a class="dropdown-item d-flex align-items-center px-2 py-2 rounded hov-bg-soft-primary" onclick="duplicateProduct({{$product->id}},'{{ $type }}')" href="javascript:void(0);">
                                    <i class="las la-copy mr-2 fs-16 text-muted"></i>
                                    <span class="fs-13 text-secondary fw-500">{{translate('Make a Clone')}}</span>
                                </a>
                                @endif

                                <!-- Digital Download -->
                                @if($product->digital && auth()->user()->can('add_digital_product'))
                                <a class="dropdown-item d-flex align-items-center px-2 py-2 rounded hov-bg-soft-primary" href="{{route('digitalproducts.download', encrypt($product->id))}}">
                                    <i class="las la-download mr-2 fs-16 text-muted"></i>
                                    <span class="fs-13 text-secondary fw-500">{{translate('Download')}}</span>
                                </a>
                                @endif
                                
                                @if(!$product->digital && !auth()->user()->can('product_duplicate'))
                                    <span class="dropdown-item-text fs-12 text-muted">{{ translate('No more options') }}</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
            @endforeach
            @if($products->isEmpty())
                @include('backend.partials._empty_state', ['message' => 'No products found.', 'icon' => 'la-box-open'])
            @endif
        </tbody>
    </table>
    <div class="aiz-pagination" id="pagination">
        {{ $products->links() }}
    </div>
</div>