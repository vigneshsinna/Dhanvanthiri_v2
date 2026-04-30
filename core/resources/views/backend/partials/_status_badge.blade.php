{{-- 
    Status Badge Partial — S5
    Usage: @include('backend.partials._status_badge', ['status' => $order->delivery_status])
    Optional: @include('backend.partials._status_badge', ['status' => $status, 'label' => 'Custom Label'])
--}}
@php
    $badgeColors = [
        // Delivery statuses
        'pending'       => 'warning',
        'confirmed'     => 'info',
        'picked_up'     => 'info',
        'on_the_way'    => 'primary',
        'delivered'     => 'success',
        'cancelled'     => 'danger',
        
        // Payment statuses
        'paid'          => 'success',
        'unpaid'        => 'danger',
        
        // General statuses
        'active'        => 'success',
        'inactive'      => 'secondary',
        'approved'      => 'success',
        'rejected'      => 'danger',
        'verified'      => 'success',
        'unverified'    => 'warning',
        'un_verified'   => 'warning',
        'published'     => 'success',
        'draft'         => 'secondary',
        'expired'       => 'danger',
        'blocked'       => 'danger',
        'suspicious'    => 'info',
        
        // Refund statuses
        'refunded'      => 'success',
        'partially_refunded' => 'warning',
        
        // Seller statuses
        'pending_approval' => 'warning',
    ];
    
    $color = $badgeColors[$status ?? ''] ?? 'secondary';
    $displayLabel = $label ?? ucfirst(str_replace('_', ' ', $status ?? 'Unknown'));
@endphp
<span class="badge badge-inline badge-{{ $color }}">{{ translate($displayLabel) }}</span>
