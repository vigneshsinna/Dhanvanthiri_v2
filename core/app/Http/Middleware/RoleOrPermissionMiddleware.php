<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Middlewares\RoleOrPermissionMiddleware as SpatieRoleOrPermissionMiddleware;
use Illuminate\Support\Facades\Auth;

class RoleOrPermissionMiddleware extends SpatieRoleOrPermissionMiddleware
{
    public function handle($request, Closure $next, $roleOrPermission, $guard = null)
    {
        if (Auth::check() && Auth::user()->user_type == 'admin') {
            return $next($request);
        }

        return parent::handle($request, $next, $roleOrPermission, $guard);
    }
}
