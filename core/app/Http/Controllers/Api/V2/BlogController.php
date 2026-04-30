<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use App\Http\Resources\V2\BlogCollection;
use App\Models\Blog;
use App\Models\BlogCategory;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function blog_list(Request $request)
    {

        $selected_categories = array();
        $search = null;
        $blogs = Blog::query();

        if ($request->has('search')) {
            $search = $request->search;;
            $blogs->where(function ($q) use ($search) {
                foreach (explode(' ', trim($search)) as $word) {
                    $q->where('title', 'like', '%' . $word . '%')
                        ->orWhere('short_description', 'like', '%' . $word . '%');
                }
            });

            $case1 = $search . '%';
            $case2 = '%' . $search . '%';

            $blogs->orderByRaw("CASE 
                WHEN title LIKE '$case1' THEN 1 
                WHEN title LIKE '$case2' THEN 2 
                ELSE 3 
                END");
        }

        if ($request->has('selected_categories')) {
            $selected_categories = $request->selected_categories;
            $blog_categories = BlogCategory::whereIn('slug', $selected_categories)->pluck('id')->toArray();

            $blogs->whereIn('category_id', $blog_categories);
        }

        $blogs = $blogs->where('status', 1)->orderBy('created_at', 'desc')->paginate(3);

        $recent_blogs = Blog::where('status', 1)->orderBy('created_at', 'desc')->limit(3)->get();
        return response()->json([
            'result' => true,
            'blogs' => new BlogCollection($blogs),
            'selected_categories' => $selected_categories,
            'search' => $search,
            'recent_blogs' => $recent_blogs
        ]);
    }

    public function blog_details($slug)
    {
        $blog = Blog::where('slug', $slug)->first();
        $recent_blogs = Blog::where('status', 1)->orderBy('created_at', 'desc')->limit(9)->get();
        return response()->json([
            'result' => true,
            'blog' => $blog ? [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'short_description' => $blog->short_description,
                'description' => $blog->description,
                'banner' => uploaded_asset($blog->banner),
                'meta_title' => $blog->meta_title,
                'meta_description' => $blog->meta_description,
                'status' => $blog->status,
                'category' => optional($blog->category)->category_name,
                'created_at' => optional($blog->created_at)->toISOString(),
                'published_at' => (int) $blog->status === 1 ? optional($blog->created_at)->toDateString() : null,
            ] : null,
            'recent_blogs' => $recent_blogs,
        ]);
    }

    public function test()
    {
        return response()->json([
            'result' => true,
            'message' => 'okk...',
        ]);
    }
}
