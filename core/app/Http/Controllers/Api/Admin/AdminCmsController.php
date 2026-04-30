<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Contact;
use App\Models\CustomAlert;
use App\Models\DynamicPopup;
use App\Models\EmailTemplate;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminCmsController extends Controller
{
    use AdminAuth;

    // ── Banners ──

    public function bannersIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $banners = Banner::latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $banners->map(fn(Banner $b) => [
                    'id' => $b->id,
                    'photo' => uploaded_asset($b->photo),
                    'url' => $b->url ?? '',
                    'position' => $b->position ?? 1,
                    'published' => (bool) ($b->published ?? true),
                ])->values(),
            ],
        ]);
    }

    public function bannersStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'photo' => ['nullable', 'integer'],
            'url' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'integer'],
        ]);

        $banner = new Banner();
        $banner->photo = $payload['photo'] ?? null;
        $banner->url = $payload['url'] ?? '';
        $banner->position = $payload['position'] ?? 1;
        $banner->published = true;
        $banner->save();

        return response()->json(['success' => true, 'message' => 'Banner created', 'data' => ['id' => $banner->id]]);
    }

    public function bannersUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $banner = Banner::findOrFail($id);
        if ($request->has('photo')) $banner->photo = $request->input('photo');
        if ($request->has('url')) $banner->url = $request->input('url');
        if ($request->has('position')) $banner->position = $request->input('position');
        if ($request->has('published')) $banner->published = $request->boolean('published');
        $banner->save();

        return response()->json(['success' => true, 'message' => 'Banner updated']);
    }

    public function bannersDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Banner::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Banner deleted']);
    }

    // ── Alerts ──

    public function alertsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $alerts = CustomAlert::latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $alerts->map(fn(CustomAlert $a) => [
                    'id' => $a->id,
                    'status' => (bool) $a->status,
                    'type' => $a->type,
                    'description' => $a->description,
                    'banner' => uploaded_asset($a->banner),
                    'link' => $a->link,
                    'background_color' => $a->background_color,
                    'text_color' => $a->text_color,
                ])->values(),
            ],
        ]);
    }

    public function alertsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'type' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'link' => ['nullable', 'string', 'max:500'],
            'background_color' => ['nullable', 'string', 'max:20'],
            'text_color' => ['nullable', 'string', 'max:20'],
        ]);

        $alert = CustomAlert::create(array_merge($payload, ['status' => true]));

        return response()->json(['success' => true, 'message' => 'Alert created', 'data' => ['id' => $alert->id]]);
    }

    public function alertsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $alert = CustomAlert::findOrFail($id);
        $alert->update($request->only(['status', 'type', 'description', 'link', 'background_color', 'text_color', 'banner']));

        return response()->json(['success' => true, 'message' => 'Alert updated']);
    }

    public function alertsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        CustomAlert::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Alert deleted']);
    }

    // ── Popups ──

    public function popupsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $popups = DynamicPopup::latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $popups->map(fn(DynamicPopup $p) => [
                    'id' => $p->id,
                    'status' => (bool) $p->status,
                    'title' => $p->title,
                    'summary' => $p->summary,
                    'banner' => uploaded_asset($p->banner),
                    'btn_link' => $p->btn_link,
                    'btn_text' => $p->btn_text,
                    'show_subscribe_form' => (bool) $p->show_subscribe_form,
                ])->values(),
            ],
        ]);
    }

    public function popupsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'btn_link' => ['nullable', 'string', 'max:500'],
            'btn_text' => ['nullable', 'string', 'max:100'],
            'show_subscribe_form' => ['nullable', 'boolean'],
        ]);

        $popup = DynamicPopup::create(array_merge($payload, ['status' => true]));

        return response()->json(['success' => true, 'message' => 'Popup created', 'data' => ['id' => $popup->id]]);
    }

    public function popupsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $popup = DynamicPopup::findOrFail($id);
        $popup->update($request->only([
            'status', 'title', 'summary', 'banner',
            'btn_link', 'btn_text', 'btn_text_color',
            'btn_background_color', 'show_subscribe_form',
        ]));

        return response()->json(['success' => true, 'message' => 'Popup updated']);
    }

    public function popupsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        DynamicPopup::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Popup deleted']);
    }

    // ── Contact Messages ──

    public function contactMessagesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);
        $messages = Contact::latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $messages->getCollection()->map(fn(Contact $c) => [
                    'id' => $c->id,
                    'name' => $c->name ?? '',
                    'email' => $c->email ?? '',
                    'subject' => $c->subject ?? '',
                    'message' => $c->message ?? '',
                    'read' => (bool) ($c->read ?? false),
                    'created_at' => optional($c->created_at)->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($messages),
            ],
        ]);
    }

    public function contactMessageRead(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $message = Contact::findOrFail($id);
        $message->read = true;
        $message->save();

        return response()->json(['success' => true, 'message' => 'Marked as read']);
    }

    public function contactMessageDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Contact::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Message deleted']);
    }

    // ── Subscribers ──

    public function subscribersIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);
        $subscribers = Subscriber::latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $subscribers->getCollection()->map(fn(Subscriber $s) => [
                    'id' => $s->id,
                    'email' => $s->email ?? '',
                    'active' => (bool) ($s->active ?? true),
                    'created_at' => optional($s->created_at)->toISOString(),
                ])->values(),
                'meta' => $this->paginationMeta($subscribers),
            ],
        ]);
    }

    public function subscriberToggle(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $subscriber = Subscriber::findOrFail($id);
        $subscriber->active = !$subscriber->active;
        $subscriber->save();

        return response()->json(['success' => true, 'message' => 'Subscriber status toggled']);
    }

    public function subscriberDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Subscriber::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Subscriber deleted']);
    }

    // ── Notification Templates ──

    public function notificationTemplatesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $templates = EmailTemplate::latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $templates->map(fn(EmailTemplate $t) => [
                    'id' => $t->id,
                    'name' => $t->name ?? '',
                    'subject' => $t->subject ?? '',
                    'body' => $t->body ?? '',
                    'type' => $t->type ?? 'email',
                    'enabled' => (bool) ($t->enabled ?? true),
                ])->values(),
            ],
        ]);
    }

    public function notificationTemplateUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $template = EmailTemplate::findOrFail($id);

        if ($request->has('subject')) $template->subject = $request->input('subject');
        if ($request->has('body')) $template->body = $request->input('body');
        if ($request->has('name')) $template->name = $request->input('name');
        $template->save();

        return response()->json(['success' => true, 'message' => 'Template updated']);
    }

    public function notificationTemplateToggle(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $template = EmailTemplate::findOrFail($id);
        $template->enabled = !($template->enabled ?? true);
        $template->save();

        return response()->json(['success' => true, 'message' => 'Template toggled']);
    }

    public function notificationTemplatePreview(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $template = EmailTemplate::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'subject' => $template->subject ?? '',
                'body' => $template->body ?? '',
                'preview_html' => '<div style="padding:16px">' . ($template->body ?? '') . '</div>',
            ],
        ]);
    }

    public function testSmtp(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $payload = $request->validate(['email' => ['required', 'email']]);

        try {
            Mail::raw('This is a test email from Dhanvathiri admin panel.', function ($msg) use ($payload) {
                $msg->to($payload['email'])->subject('SMTP Test');
            });
            return response()->json(['success' => true, 'message' => 'Test email sent to ' . $payload['email']]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'SMTP test failed: ' . $e->getMessage()], 500);
        }
    }
}
