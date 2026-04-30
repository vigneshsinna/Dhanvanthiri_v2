<?php

namespace App\Http\Resources\V2;

use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontPageResource extends JsonResource
{
    public function toArray($request)
    {
        $title = $this->resource->getTranslation('title');
        $content = $this->resource->getTranslation('content');
        $contact = null;

        if ($this->type === 'contact_us_page') {
            $decoded = json_decode($content, true);

            if (is_array($decoded)) {
                $contact = [
                    'description' => $decoded['description'] ?? '',
                    'address' => $decoded['address'] ?? '',
                    'phone' => $decoded['phone'] ?? '',
                    'email' => $decoded['email'] ?? '',
                ];

                $content = $contact['description'];
            }
        }

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'type' => $this->type,
            'title' => $title ?: $this->title,
            'content' => $content ?: '',
            'body' => $content ?: '',
            'meta_title' => $this->meta_title ?: ($title ?: $this->title),
            'meta_description' => $this->meta_description ?: '',
            'meta_image' => $this->meta_image ? uploaded_asset($this->meta_image) : '',
            'contact' => $contact,
        ];
    }
}
