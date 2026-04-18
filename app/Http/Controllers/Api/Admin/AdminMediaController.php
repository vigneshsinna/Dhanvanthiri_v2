<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Upload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AdminMediaController extends Controller
{
    use AdminAuth;

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request, 24);
        $type = $request->input('type');
        $search = trim((string) $request->input('search', ''));

        $query = Upload::latest('id');

        if ($type) {
            $query->where('type', $type);
        }
        if ($search !== '') {
            $query->where('file_original_name', 'like', '%' . $search . '%');
        }

        $media = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $media->getCollection()->map(fn(Upload $u) => $this->serialize($u))->values(),
                'meta' => $this->paginationMeta($media),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $upload = Upload::findOrFail($id);

        return response()->json(['success' => true, 'data' => ['data' => $this->serialize($upload)]]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->ensureAdmin($request);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $typeMap = [
            'jpg' => 'image', 'jpeg' => 'image', 'png' => 'image',
            'gif' => 'image', 'webp' => 'image', 'svg' => 'image',
            'mp4' => 'video', 'webm' => 'video',
            'pdf' => 'document', 'doc' => 'document', 'docx' => 'document',
        ];

        $dir = public_path('uploads/all');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        $newFileName = rand(10000000000, 9999999999) . date('YmdHis') . '.' . $extension;
        $file->move($dir, $newFileName);

        $upload = new Upload();
        $upload->file_original_name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $upload->extension = $extension;
        $upload->file_name = 'uploads/all/' . $newFileName;
        $upload->user_id = $user->id;
        $upload->type = $typeMap[$extension] ?? 'other';
        $upload->file_size = File::size($dir . '/' . $newFileName);
        $upload->save();

        return response()->json([
            'success' => true,
            'message' => 'File uploaded',
            'data' => $this->serialize($upload),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $upload = Upload::findOrFail($id);

        if ($request->has('file_original_name')) {
            $upload->file_original_name = $request->input('file_original_name');
        }
        $upload->save();

        return response()->json(['success' => true, 'message' => 'Media updated', 'data' => $this->serialize($upload)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $upload = Upload::findOrFail($id);

        $filePath = public_path($upload->file_name);
        if (File::exists($filePath)) {
            File::delete($filePath);
        }

        $upload->delete();

        return response()->json(['success' => true, 'message' => 'Media deleted']);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $ids = $request->validate(['ids' => ['required', 'array']])['ids'];

        $uploads = Upload::whereIn('id', $ids)->get();
        foreach ($uploads as $upload) {
            $filePath = public_path($upload->file_name);
            if (File::exists($filePath)) {
                File::delete($filePath);
            }
            $upload->delete();
        }

        return response()->json(['success' => true, 'message' => count($ids) . ' files deleted']);
    }

    public function stats(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'total_files' => Upload::count(),
                'total_images' => Upload::where('type', 'image')->count(),
                'total_size' => Upload::sum('file_size'),
                'by_type' => [
                    'image' => Upload::where('type', 'image')->count(),
                    'video' => Upload::where('type', 'video')->count(),
                    'document' => Upload::where('type', 'document')->count(),
                    'other' => Upload::whereNotIn('type', ['image', 'video', 'document'])->count(),
                ],
            ],
        ]);
    }

    private function serialize(Upload $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->file_original_name,
            'file_name' => $u->file_name,
            'extension' => $u->extension,
            'type' => $u->type,
            'size' => (int) $u->file_size,
            'url' => uploaded_asset($u->id),
            'created_at' => optional($u->created_at)->toISOString(),
        ];
    }
}
