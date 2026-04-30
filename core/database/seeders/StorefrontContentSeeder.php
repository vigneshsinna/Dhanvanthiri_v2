<?php

use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\BusinessSetting;
use App\Models\Page;
use App\Models\Upload;
use App\Models\User;
use Illuminate\Database\Seeder;

class StorefrontContentSeeder extends Seeder
{
    public function run()
    {
        $this->seedStorefrontSettings();
        $this->seedBlogCategories();
        $this->seedBlogPosts();
        $this->seedFaqPage();
        $this->seedAboutPage();
        $this->seedContactPage();
        $this->seedPolicyPages();
    }

    private function seedStorefrontSettings()
    {
        foreach ([
            'uploads/all/dhanvanthiri-logo.png',
            'uploads/all/hero-pickles.png',
        ] as $assetPath) {
            $this->registerUpload($assetPath);
        }

        $settings = [
            'site_name' => 'Dhanvanthiri Foods',
            'website_name' => 'Dhanvanthiri Foods',
            'header_logo' => 'uploads/all/dhanvanthiri-logo.png',
            'footer_logo' => 'uploads/all/dhanvanthiri-logo.png',
            'site_icon' => 'uploads/all/dhanvanthiri-logo.png',
            'meta_description' => 'Traditional South Indian pickles and thokku, handcrafted with authentic family recipes passed down through generations.',
            'header_announcement' => 'Free shipping on orders above Rs.499 | Freshly handmade with love',
            'header_menu_labels' => json_encode(['Products', 'Blog', 'FAQ', 'About']),
            'header_menu_links' => json_encode(['/products', '/blog', '/faq', '/pages/about']),
            'home_banner1_images' => json_encode(['uploads/all/hero-pickles.png']),
            'home_banner1_links' => json_encode(['/products']),
            'about_us_description' => 'Traditional South Indian pickles and thokku, handcrafted with authentic family recipes passed down through generations.',
            'frontend_copyright_text' => 'Dhanvanthiri Foods. All rights reserved. Made with love in India.',
            'contact_email' => 'dhanvanthrifoods777@gmail.com',
            'contact_phone' => '9445717977',
            'contact_address' => 'Erode, Tamil Nadu, India',
        ];

        foreach ($settings as $type => $value) {
            BusinessSetting::updateOrCreate(
                ['type' => $type],
                ['value' => $value]
            );
        }
    }

    private function seedBlogCategories()
    {
        $categories = [
            ['category_name' => 'Traditions', 'slug' => 'traditions'],
            ['category_name' => 'Health & Wellness', 'slug' => 'health-wellness'],
            ['category_name' => 'Recipes', 'slug' => 'recipes'],
        ];

        foreach ($categories as $cat) {
            BlogCategory::updateOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
        }
    }

    private function seedBlogPosts()
    {
        $posts = [
            [
                'title' => 'The Art of Traditional Pickle Making',
                'slug' => 'art-of-traditional-pickle-making',
                'category_slug' => 'traditions',
                'short_description' => 'Discover the art of traditional South Indian pickle making, including ingredients, techniques, and preservation methods used for generations.',
                'description' => '<h2>Introduction</h2>
<p>Traditional pickle making is an age-old culinary practice deeply rooted in South Indian households. Long before refrigeration became common, families relied on natural preservation techniques using <strong>salt, oil, and spices</strong> to store seasonal produce.</p>
<p>These homemade pickles were not only incredibly flavorful but also a beautiful way to celebrate tradition, agriculture, and local culture.</p>

<blockquote>"A meal without pickle is like a story without a soul. It brings the perfect balance of tang, spice, and comfort."</blockquote>

<h2>Choosing the Right Ingredients</h2>
<p>Fresh ingredients are the absolute foundation of authentic pickles. <em>Raw mangoes, lemons, gooseberries (amla), garlic, and ginger</em> are among the most commonly used heroes of the pickle jar.</p>
<p>High-quality, freshly roasted spices such as <strong>mustard seeds, fenugreek seeds, earthy turmeric, fiery red chili powder, and aromatic asafoetida (hing)</strong> provide the distinctive, mouth-watering flavor profile we all love.</p>

<h2>Why Oil and Salt Are Essential</h2>
<p>Salt and oil serve two critical, irreplaceable roles in traditional pickle making:</p>
<ul>
<li><strong>Salt:</strong> Acts as a natural dehydrator, removing excess moisture and preventing any bacterial growth.</li>
<li><strong>Cold-pressed Sesame Oil (Gingelly oil):</strong> Enhances the deep, nutty flavor while acting as a perfect seal to extend shelf life naturally.</li>
</ul>
<p>Together, they ensure that pickles remain safe and incredibly flavorful for months, even years.</p>

<h2>Sun Fermentation: The Traditional Method</h2>
<p>Sunlight plays a vital, almost magical role in the fermentation process. Pickle jars are often kept in direct sunlight for several days, allowing the ingredients, spices, and oils to blend and mature naturally under the warm sun.</p>
<p>This slow, deliberate fermentation process develops the <em>deep, complex, and punchy flavors</em> that define truly traditional South Indian pickles.</p>

<h2>Preserving Culture Through Food</h2>
<p>Traditional pickle making represents much more than just a cooking technique. It is a living, breathing cultural tradition that brings families together, sparking joy and preserving our culinary heritage across generations.</p>',
                'meta_title' => 'Traditional South Indian Pickle Making – Techniques, Ingredients & Tips',
                'meta_description' => 'Discover the art of traditional South Indian pickle making, including ingredients, techniques, and preservation methods used for generations.',
                'banner_path' => 'uploads/all/blog/traditional-pickle-making.png',
                'status' => 1,
            ],
            [
                'title' => '5 Health Benefits of Curry Leaves You Didn\'t Know',
                'slug' => 'health-benefits-curry-leaves',
                'category_slug' => 'health-wellness',
                'short_description' => 'Learn the top health benefits of curry leaves including digestion support, hair growth, blood sugar control, and antioxidant properties.',
                'description' => '<h2>Introduction</h2>
<p><em>Curry leaves (Karuveppilai)</em> are an absolute essential in South Indian cooking, instantly recognized by their distinctive, mouth-watering aroma and citrusy, earthy flavor.</p>
<p>However, these small green leaves offer far more than just culinary appeal. Packed to the brim with <strong>vitamins, powerful antioxidants, and medicinal compounds</strong>, curry leaves have been revered and used in traditional Ayurvedic medicine for centuries.</p>

<blockquote>"Curry leaves aren\'t just a garnish; they are a powerhouse of everyday wellness and traditional healing."</blockquote>

<h2>1. Rich Source of Antioxidants</h2>
<p>Curry leaves contain incredibly powerful antioxidants that protect the body from oxidative stress and free radical damage.</p>
<p>Regular consumption of these antioxidants contributes to <strong>significantly improved immunity</strong> and long-term overall wellness.</p>

<h2>2. Supports Healthy Digestion</h2>
<p>Curry leaves naturally stimulate digestive enzymes and help your digestive system function much more efficiently, breaking down food with ease.</p>
<p>They have traditionally been used to relieve <em>indigestion, bloating, and mild nausea</em>—making them the perfect addition to heavy meals.</p>

<h2>3. Helps Maintain Healthy Blood Sugar</h2>
<p>Modern studies suggest that curry leaves may naturally help regulate blood sugar levels. This makes them highly beneficial for individuals actively managing <strong>diabetes or overall metabolic health</strong>.</p>

<h2>4. Promotes Hair Growth and Scalp Health</h2>
<p>If you\'ve ever wondered about the secret to thick, healthy hair, look no further. Curry leaves contain critical nutrients such as <strong>beta-carotene and vital proteins</strong> that strengthen hair follicles, prevent thinning, and actively promote hair growth.</p>
<p>Because of this, they are a primary, irreplaceable ingredient in traditional herbal hair oils.</p>

<h2>5. Supports Heart Health</h2>
<p>Curry leaves help actively reduce bad cholesterol levels and support overall cardiovascular health, keeping your heart functioning beautifully.</p>
<p>Their natural <em>anti-inflammatory properties</em> also contribute to improved blood circulation throughout the body.</p>

<h2>Conclusion</h2>
<p>Though small in size, curry leaves offer truly remarkable health benefits. Purposely including them in your daily diet—whether in <em>thokku, podi, or a simple tadka</em>—can contribute to improved digestion, stunning hair health, and vibrant overall wellness.</p>',
                'meta_title' => '5 Health Benefits of Curry Leaves – Nutrition, Hair & Digestion Benefits',
                'meta_description' => 'Learn the top health benefits of curry leaves including digestion support, hair growth, blood sugar control, and antioxidant properties.',
                'banner_path' => 'uploads/all/blog/curry-leaves-health.png',
                'status' => 1,
            ],
            [
                'title' => 'Perfect Pairings: What to Eat with Your Favourite Podi',
                'slug' => 'perfect-podi-pairings',
                'category_slug' => 'recipes',
                'short_description' => 'Discover the best foods to pair with South Indian podi including idli, dosa, rice with ghee, and creative modern snack ideas.',
                'description' => '<h2>Introduction</h2>
<p><em>Podi</em>, often playfully and affectionately called <strong>"gunpowder,"</strong> is a beloved, deeply rooted South Indian condiment made from carefully dry-roasted lentils, vibrant red chilies, and aromatic spices.</p>
<p>Known for its bold, punchy flavor and incredible versatility, a good quality podi can instantly elevate the simplest of meals into something truly delicious and soul-satisfying.</p>

<blockquote>"A spoonful of podi, a drizzle of ghee, and hot rice—the ultimate trio of South Indian comfort food."</blockquote>

<h2>Idli with Podi</h2>
<p>Soft, pillowy steamed <em>idlis</em> generously coated or paired with golden sesame oil (gingelly) and spicy podi create one of the most iconic, undisputed champion combinations in South Indian cuisine.</p>
<p>The mild, fermented tang of the idli completely absorbs and complements the <strong>spicy, nutty crunch</strong> of the podi perfectly.</p>

<h2>Dosa with Podi</h2>
<p>A thin, crispy golden <em>dosa</em> sprinkled generously with podi and roasted to perfection with ghee is another immensely popular weekend pairing.</p>
<p>Many devoted dosa lovers exclusively crave <strong>"podi dosa,"</strong> where the spicy gunpowder is spread directly inside the dosa while cooking, creating a spicy, caramelized interior crust.</p>

<h2>Rice with Ghee and Podi</h2>
<p>Hot, naturally steamed white rice mixed immediately with a generous dollop of rich, fragrant ghee and Paruppu Podi is a comforting, deeply satisfying meal that requires practically <em>zero cooking effort</em>. It is the ultimate rainy day comfort food.</p>

<h2>Podi with Vegetable Dishes</h2>
<p>Podi can beautifully enhance and transform everyday vegetable stir-fries (poriyal), such as roasted baby potatoes, crunchy green beans, and sticky okra.</p>
<p>Sprinkling a spoonful of podi right at the end of cooking adds an instant <strong>depth, spice, and unique crunch</strong> to everyday meals.</p>

<h2>Modern, Crave-Worthy Snack Pairings</h2>
<p>Creative, modern cooks are now brilliantly using traditional podi to spice up contemporary snacks:</p>
<ul>
<li><strong>Podi Avocado Toast:</strong> A spicy South Indian twist on a modern brunch classic.</li>
<li><strong>Podi Popcorn:</strong> Tossed immediately after popping with a little melted butter.</li>
<li><strong>Podi Roasted Nuts:</strong> Cashews and peanuts tossed in ghee and podi for a fiery evening snack.</li>
</ul>
<p>These brilliant fusion ideas bring bold, traditional South Indian flavours seamlessly into contemporary, fast-paced kitchens.</p>

<h2>Conclusion</h2>
<p>Whether it\'s paired with <em>classic, traditional South Indian tiffins</em> or sprinkled over incredibly modern snacks, podi undeniably remains one of the most versatile, magical condiments in all of Indian cuisine.</p>',
                'meta_title' => 'Best Foods to Eat with Podi – Idli, Dosa, Rice & More',
                'meta_description' => 'Discover the best foods to pair with South Indian podi including idli, dosa, rice with ghee, and creative modern snack ideas.',
                'banner_path' => 'uploads/all/blog/podi-pairings.png',
                'status' => 1,
            ],
        ];

        foreach ($posts as $postData) {
            $categorySlug = $postData['category_slug'];
            $bannerPath = $postData['banner_path'] ?? null;
            unset($postData['category_slug'], $postData['banner_path']);

            $category = BlogCategory::where('slug', $categorySlug)->first();
            $postData['category_id'] = $category ? $category->id : null;

            if ($bannerPath) {
                $bannerId = $this->registerUpload($bannerPath);
                if ($bannerId) {
                    $postData['banner'] = $bannerId;
                    $postData['meta_img'] = $bannerId;
                }
            }

            Blog::updateOrCreate(
                ['slug' => $postData['slug']],
                $postData
            );
        }
    }

    private function seedFaqPage()
    {
        $faqs = [
            ['id' => 1, 'question' => 'Are your products preservative-free?', 'answer' => 'Yes! All our pickles, thokku, and podi are 100% natural with zero chemical preservatives. We use traditional methods like sun-drying and cold-pressed oils to ensure a long shelf life naturally.', 'category' => 'Products', 'sort_order' => 1, 'is_active' => true],
            ['id' => 2, 'question' => 'What oils do you use?', 'answer' => 'We primarily use cold-pressed gingelly (sesame) oil and groundnut oil — the same oils used in traditional South Indian kitchens for generations.', 'category' => 'Products', 'sort_order' => 2, 'is_active' => true],
            ['id' => 3, 'question' => 'How long do the pickles last?', 'answer' => 'When stored in a cool, dry place with a clean, dry spoon, our pickles typically last 6–12 months. Podi and chutney powders last 3–6 months.', 'category' => 'Products', 'sort_order' => 3, 'is_active' => true],
            ['id' => 4, 'question' => 'Do you ship across India?', 'answer' => 'Yes, we deliver pan-India! Orders are typically dispatched within 1–2 business days. Delivery takes 3–7 days depending on your location.', 'category' => 'Shipping', 'sort_order' => 4, 'is_active' => true],
            ['id' => 5, 'question' => 'Is there free shipping?', 'answer' => 'We offer free shipping on all orders above ₹499. For orders below ₹499, a flat shipping fee of ₹49 applies.', 'category' => 'Shipping', 'sort_order' => 5, 'is_active' => true],
            ['id' => 6, 'question' => 'Can I return or exchange a product?', 'answer' => 'Due to the perishable nature of our products, we do not accept returns. However, if you receive a damaged or wrong product, we will happily replace it. Please contact us within 48 hours of delivery with photos.', 'category' => 'Orders', 'sort_order' => 6, 'is_active' => true],
            ['id' => 7, 'question' => 'What payment methods do you accept?', 'answer' => 'We accept UPI, credit/debit cards, net banking, and popular wallets like Paytm and PhonePe through our secure payment gateway.', 'category' => 'Orders', 'sort_order' => 7, 'is_active' => true],
            ['id' => 8, 'question' => 'Are your products suitable for vegetarians?', 'answer' => 'Absolutely! All Dhanvanthiri Foods products are 100% vegetarian and made in a vegetarian-only kitchen.', 'category' => 'Products', 'sort_order' => 8, 'is_active' => true],
        ];

        Page::updateOrCreate(
            ['slug' => 'faq'],
            [
                'title' => 'Frequently Asked Questions',
                'type' => 'custom_page',
                'content' => json_encode($faqs),
                'meta_title' => 'FAQ | Dhanvanthiri Foods',
                'meta_description' => 'Find answers to common questions about Dhanvanthiri Foods products, shipping, returns, and more.',
            ]
        );
    }

    private function seedAboutPage()
    {
        $this->registerUpload('uploads/all/about/brand-story.png');
        $this->registerUpload('uploads/all/about/mission-vision.png');

        $body = '<p><img src="/uploads/all/about/brand-story.png" alt="Dhanvanthiri Foods traditional handmade products" /></p>
<h2>Our Story</h2>
<p>Dhanvanthiri Foods was born out of a simple desire — to share the authentic flavours of South Indian homemade pickles and condiments with the world. What started in a small kitchen with family recipes passed down over generations has grown into a brand loved by food enthusiasts across India.</p>

<p><img src="/uploads/all/about/mission-vision.png" alt="Dhanvanthiri Foods mission and traditional preparation" /></p>
<h2>Our Mission</h2>
<p>We believe that good food starts with the best ingredients and traditional methods. Every jar of pickle, every bowl of thokku, and every spoonful of podi is made with:</p>
<ul>
  <li><strong>100% natural ingredients</strong> — no preservatives, no artificial colours</li>
  <li><strong>Cold-pressed oils</strong> — gingelly and groundnut oil for authentic taste</li>
  <li><strong>Hand-picked spices</strong> — sourced directly from local farmers</li>
  <li><strong>Time-honoured recipes</strong> — perfected over generations</li>
</ul>

<h2>What Makes Us Special</h2>
<p>At Dhanvanthiri Foods, we don\'t just make pickles — we preserve traditions. Each product is handcrafted in small batches to ensure quality and consistency. We sun-dry our ingredients, grind spices on traditional stone grinders, and use the same love and care that our grandmothers did.</p>

<h2>Our Promise</h2>
<p>Every Dhanvanthiri product reaches you fresh, flavourful, and made with integrity. We are committed to bringing the taste of home to your dining table, no matter where you are in India.</p>';

        Page::updateOrCreate(
            ['slug' => 'about'],
            [
                'title' => 'About Dhanvanthiri Foods',
                'type' => 'custom_page',
                'content' => $body,
                'meta_title' => 'About Us - Dhanvanthiri Foods',
                'meta_image' => 'uploads/all/about/brand-story.png',
                'meta_description' => 'Learn about Dhanvanthiri Foods — a family-run brand bringing you authentic South Indian pickles, thokku, and podi made with love and tradition.',
            ]
        );
    }

    private function seedContactPage()
    {
        Page::updateOrCreate(
            ['slug' => 'contact-us'],
            [
                'title' => 'Contact Us',
                'type' => 'contact_us_page',
                'content' => json_encode([
                    'description' => 'We would love to hear from you. Reach out for orders, product questions, feedback, or store support.',
                    'address' => 'Dhanvanthiri Foods, Erode, Tamil Nadu, India',
                    'phone' => '9445717977',
                    'email' => 'dhanvanthrifoods777@gmail.com',
                ], JSON_UNESCAPED_UNICODE),
                'meta_title' => 'Contact Us | Dhanvanthiri Foods',
                'meta_description' => 'Get in touch with Dhanvanthiri Foods for product questions, order support, and general enquiries.',
            ]
        );
    }

    private function seedPolicyPages()
    {
        $pages = [
            [
                'slug' => 'privacy-policy',
                'title' => 'Privacy Policy',
                'type' => 'privacy_policy_page',
                'content' => '<h2>Overview</h2>
<p>This Privacy Policy explains how Dhanvanthiri Foods collects, uses, stores, and shares personal information when you browse our website, place an order, contact us, or otherwise interact with our business.</p>
<h2>Information We Collect</h2>
<ul>
  <li>Name, mobile number, email address, and account details</li>
  <li>Shipping and billing address</li>
  <li>Order history, payment status, and support messages</li>
  <li>Technical data such as IP address, device details, and pages visited</li>
</ul>
<h2>How We Use It</h2>
<p>We use this information to process orders, support deliveries, respond to customer issues, prevent fraud, and comply with legal obligations.</p>
<h2>Sharing and Retention</h2>
<p>We may share required information with payment providers, courier partners, hosting vendors, and service providers that help us operate the store. We retain information only as long as reasonably needed for service, compliance, and dispute handling.</p>
<h2>Your Rights</h2>
<p>You may request correction, deletion where legally permitted, or withdrawal of optional marketing consent by contacting us.</p>
<h2>Privacy Contact</h2>
<p>Email: <a href="mailto:dhanvanthrifoods777@gmail.com">dhanvanthrifoods777@gmail.com</a><br />Phone: <a href="tel:+919445717977">9445717977</a></p>',
                'meta_title' => 'Privacy Policy | Dhanvanthiri Foods',
                'meta_description' => 'Learn what data Dhanvanthiri Foods collects, why it is collected, how it is shared, and how customers can request correction or deletion.',
            ],
            [
                'slug' => 'terms',
                'title' => 'Terms & Conditions',
                'type' => 'terms_page',
                'content' => '<h2>Overview</h2>
<p>These Terms &amp; Conditions explain the rules for using the Dhanvanthiri Foods website and buying products from us.</p>
<h2>Business Details</h2>
<p>Dhanvanthrifoods, trading as Dhanvanthiri Foods, operates this website. Email: <a href="mailto:dhanvanthrifoods777@gmail.com">dhanvanthrifoods777@gmail.com</a>. Phone: <a href="tel:+919445717977">9445717977</a>.</p>
<h2>Pricing, Payments, and Orders</h2>
<p>All prices are shown in INR unless otherwise stated. Orders are subject to stock availability, payment verification, and serviceability. We may reject or cancel orders affected by pricing errors, fraud checks, or address issues.</p>
<h2>User Responsibilities</h2>
<p>You agree to provide accurate details, use valid payment methods, and not misuse the website or its ordering systems.</p>
<h2>Prohibited Use</h2>
<ul>
  <li>No unlawful, fraudulent, or abusive website use</li>
  <li>No scraping, hacking, bot abuse, or misleading orders</li>
  <li>No copying or reuse of site content without permission</li>
</ul>
<h2>Liability and Jurisdiction</h2>
<p>Liability is limited to the value paid for the relevant order, subject to law. These terms are governed by Indian law and the courts of Erode, Tamil Nadu.</p>',
                'meta_title' => 'Terms & Conditions | Dhanvanthiri Foods',
                'meta_description' => 'Read the website usage, pricing, payment, order acceptance, intellectual property, and liability terms for Dhanvanthiri Foods.',
            ],
            [
                'slug' => 'refund-policy',
                'title' => 'Refund / Return / Cancellation Policy',
                'type' => 'custom_page',
                'content' => '<h2>Overview</h2>
<p>Because our products are food items, return and refund handling must balance customer fairness with product safety and hygiene.</p>
<h2>Cancellation Before Dispatch</h2>
<p>Orders may be cancelled only before they are packed or handed over for dispatch.</p>
<h2>Eligible Support Scenarios</h2>
<ul>
  <li>Wrong item</li>
  <li>Missing item</li>
  <li>Damaged, leaking, or tampered package</li>
  <li>Expired product at delivery</li>
</ul>
<h2>Reporting Window and Proof</h2>
<p>Please report issues within 48 hours of delivery with the order number, clear package photos, and product photos. An unboxing video is recommended where available.</p>
<h2>Refund Timeline</h2>
<p>Approved refunds are generally initiated within 5 to 10 business days to the original payment method.</p>',
                'meta_title' => 'Refund Policy | Dhanvanthiri Foods',
                'meta_description' => 'Read Dhanvanthiri Foods rules for cancellation before dispatch, refund eligibility, replacement support, proof requirements, and refund timelines.',
            ],
            [
                'slug' => 'shipping-policy',
                'title' => 'Shipping Policy',
                'type' => 'custom_page',
                'content' => '<h2>Overview</h2>
<p>This Shipping Policy explains how Dhanvanthiri Foods processes, dispatches, and delivers orders across India.</p>
<h2>Delivery Coverage</h2>
<p>We currently deliver across India, subject to courier serviceability and the accuracy of the shipping address provided at checkout.</p>
<h2>Order Processing Time</h2>
<p>Most orders are processed within 1 to 3 business days after successful payment confirmation.</p>
<h2>Estimated Delivery Windows</h2>
<ul>
  <li>Metro cities: usually 2 to 5 business days</li>
  <li>Other cities and towns: usually 3 to 7 business days</li>
  <li>Remote locations: usually 5 to 10 business days</li>
</ul>
<h2>Shipping Charges and Delivery Issues</h2>
<p>Shipping charges, if any, are shown at checkout. Please report damaged, tampered, wrong, or missing items within 48 hours of delivery with supporting photos.</p>',
                'meta_title' => 'Shipping Policy | Dhanvanthiri Foods',
                'meta_description' => 'Review delivery coverage, order processing time, shipping charges, courier delay handling, and support steps for Dhanvanthiri Foods orders.',
            ],
        ];

        foreach ($pages as $pageData) {
            Page::updateOrCreate(
                ['slug' => $pageData['slug']],
                $pageData
            );
        }
    }

    private function registerUpload(string $relativePath, ?string $originalName = null): ?int
    {
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');

        if ($relativePath === '') {
            return null;
        }

        $absolutePath = public_path($relativePath);

        if (!is_file($absolutePath)) {
            return null;
        }

        $adminId = User::where('user_type', 'admin')->value('id')
            ?? User::where('user_type', 'super_admin')->value('id')
            ?? User::query()->value('id')
            ?? 1;

        $upload = Upload::withTrashed()->firstOrNew(['file_name' => $relativePath]);
        $upload->deleted_at = null;
        $upload->file_original_name = $originalName ?: pathinfo($relativePath, PATHINFO_FILENAME);
        $upload->extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
        $upload->user_id = $adminId;
        $upload->type = 'image';
        $upload->file_size = filesize($absolutePath) ?: 0;
        $upload->save();

        return (int) $upload->id;
    }
}
