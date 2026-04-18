<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class HeadlessStorefrontController extends Controller
{
    public function shell(Request $request): Response
    {
        $indexPath = $this->distPath('index.html');

        if (!is_file($indexPath)) {
            return response('React storefront build is unavailable.', 503, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]);
        }

        $html = file_get_contents($indexPath) ?: '';
        $assetPrefix = '/' . trim((string) config('storefront.asset_prefix', '/storefront-assets'), '/');
        $html = str_replace('/assets/', $assetPrefix . '/', $html);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function asset(string $path): BinaryFileResponse
    {
        return response()->file($this->resolveDistFile('assets', $path));
    }

    public function image(string $path): BinaryFileResponse
    {
        return response()->file($this->resolveDistFile('images', $path));
    }

    private function resolveDistFile(string $subdirectory, string $path): string
    {
        $path = ltrim($path, '/');
        if ($path === '' || str_contains($path, '..')) {
            throw new NotFoundHttpException();
        }

        $base = realpath($this->distPath($subdirectory));
        $file = realpath($this->distPath($subdirectory . DIRECTORY_SEPARATOR . $path));

        if (!$base || !$file || !str_starts_with($file, $base) || !is_file($file)) {
            throw new NotFoundHttpException();
        }

        return $file;
    }

    private function distPath(string $suffix = ''): string
    {
        $base = rtrim((string) config('storefront.dist_path'), DIRECTORY_SEPARATOR);

        return $suffix === ''
            ? $base
            : $base . DIRECTORY_SEPARATOR . ltrim($suffix, DIRECTORY_SEPARATOR);
    }
}
