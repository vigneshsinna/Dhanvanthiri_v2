    @if (get_setting('smart_bar_status') != 0)

        @php
            $bg_color = get_setting('smart_bar_background_color') ?? '#fff';
            $text_color = get_setting('smart_bar_text_color') ?? '#000';
            $colors = is_string($detailedProduct->colors) ? json_decode($detailedProduct->colors, true) : $detailedProduct->colors;
            $attributes = is_string($detailedProduct->attributes) ? json_decode($detailedProduct->attributes, true) : $detailedProduct->attributes;
        @endphp

        <div id="smart-bar" class="fixed-bottom smart-bar smart-bar-mobile"
                style="background-color: {{ $bg_color }}; color: {{ $text_color }}; padding: 0.8rem 1rem;">

            <div class="container {{-- -fluid smart-bar-container pr-8 pl-8 --}}">
                <div class="d-flex align-items-center justify-content-between" style="gap: 0.9rem;">

                    <!-- Product image -->
                    <div class="flex-shrink-0">
                        <img src="{{ uploaded_asset($detailedProduct->thumbnail_img) }}"
                            alt="{{ $detailedProduct->getTranslation('name') }}"
                            class="img-fluid rounded"
                            style="width:60px; height:60px; object-fit:cover;">
                    </div>

                    <!-- Product title -->
                    <div class="d-none d-sm-inline flex-grow-1 overflow-hidden">
                        <h6 class="mb-0 text-truncate-1" style="color: {{ $text_color }}; font-size: 14px; font-weight:500;">
                            {{ $detailedProduct->getTranslation('name') }}
                        </h6>
                    </div>

                    <!-- Price -->
                    <div class="flex-shrink-0 d-flex align-items-center" style="gap: 0.3rem;">
                        <div class="fw-700 d-block d-sm-none"
                            style="font-size: 18px; font-weight:700; color: {{ $text_color }}">
                            {{ home_discounted_price($detailedProduct) }}
                        </div>

                        <div class="d-none d-sm-flex align-items-center" style="gap: 0.3rem;">
                            @if (home_price($detailedProduct) != home_discounted_price($detailedProduct))
                                <div class="fw-700" style="font-size: 20px; font-weight:700; color: {{ $text_color }}">
                                    {{ home_discounted_price($detailedProduct) }}
                                </div>
                                <div class="text-center" style="font-size: 14px; color: {{ $text_color }}">
                                    <del class="opacity-70">{{ home_price($detailedProduct) }}</del><br>
                                    <span class="fw-600">{{ discount_in_percentage($detailedProduct) }}% OFF</span>
                                </div>
                            @else
                                <div class="fw-700" style="font-size: 20px; font-weight:700; color: {{ $text_color }}">
                                    {{ home_discounted_price($detailedProduct) }}
                                </div>
                            @endif
                        </div>
                    </div>

                    <!-- Add to cart button -->
                    <div class="flex-shrink-0">
                        @if ($detailedProduct->digital == 0)
                            @if (((get_setting('product_external_link_for_seller') == 1) && ($detailedProduct->added_by == "seller") && ($detailedProduct->external_link != null)) ||
                                (($detailedProduct->added_by != "seller") && ($detailedProduct->external_link != null)))
                            @else
                                @if ( (is_array($colors) && count($colors) > 0) || (is_array($attributes) && count($attributes) > 0) )
                                    <a href="javascript:void(0)"
                                    class="btn btn-secondary-base mr-2 add-to-cart fw-600 rounded-0 text-white"
                                    @if (Auth::check() || get_Setting('guest_checkout_activation')==1) onclick="showAddToCartModal({{ $detailedProduct->id }})" @else onclick="showLoginModal()" @endif>
                                        <i class="las la-shopping-bag"></i>
                                        <span class="d-none d-sm-inline">{{ translate('Add to cart') }}</span>
                                    </a>
                                @else
                                    <button type="button"
                                            class="btn btn-secondary-base mr-2 add-to-cart fw-600 rounded-0 text-white"
                                            @if (Auth::check() || get_Setting('guest_checkout_activation')==1) onclick="addToCart()" @else onclick="showLoginModal()" @endif>
                                        <i class="las la-shopping-bag"></i>
                                        <span class="d-none d-sm-inline">{{ translate('Add to cart') }}</span>
                                    </button>
                                @endif
                            @endif

                            <button type="button" class="btn btn-secondary out-of-stock fw-600 d-none" disabled>
                                <i class="la la-cart-arrow-down"></i>
                                <span class="d-none d-sm-inline">{{ translate('Out of Stock') }}</span>
                            </button>
                        @elseif ($detailedProduct->digital == 1)
                            <button type="button"
                                    class="btn btn-secondary-base mr-2 add-to-cart fw-600 rounded-0 text-white"
                                    @if (Auth::check() || get_Setting('guest_checkout_activation')==1) onclick="addToCart()" @else onclick="showLoginModal()" @endif>
                                <i class="las la-shopping-bag"></i>
                                <span class="d-none d-sm-inline">{{ translate('Add to cart') }}</span>
                            </button>
                        @endif
                    </div>
                    <div class="flex-shrink-0">
                        <!-- Close button -->
                        <a href="javascript:void(0)" onclick="closeSmartBar()">
                            <i style="color: {{ $text_color }};" class="la la-close la-2x"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
    @endif