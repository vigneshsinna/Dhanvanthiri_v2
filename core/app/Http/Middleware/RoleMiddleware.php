<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Middlewares\RoleMiddleware as SpatieRoleMiddleware;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware extends SpatieRoleMiddleware
{
    public function handle($request, Closure $next, $role, $guard = null)
    {
        if (Auth::check() && Auth::user()->user_type == 'admin') {
            return $next($request);
        }

        return parent::handle($request, $next, $role, $guard);
    }
}
