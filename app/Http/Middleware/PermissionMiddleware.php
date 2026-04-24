<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Middlewares\PermissionMiddleware as SpatiePermissionMiddleware;
use Illuminate\Support\Facades\Auth;

class PermissionMiddleware extends SpatiePermissionMiddleware
{
    public function handle($request, Closure $next, $permission, $guard = null)
    {
        if (Auth::check() && Auth::user()->user_type == 'admin') {
            return $next($request);
        }

        return parent::handle($request, $next, $permission, $guard);
    }
}
