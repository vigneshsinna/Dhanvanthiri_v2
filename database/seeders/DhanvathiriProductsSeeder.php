<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Upload;

class DhanvathiriProductsSeeder extends Seeder
{
    public function run()
    {
        // Clear existing products first
        DB::table('product_categories')->truncate();
        DB::table('product_stocks')->truncate();
        DB::table('products')->truncate();
        DB::table('uploads')->where('user_id', 1)->delete(); // Clean up registered images for fresh start

        $now = now();
        $adminId = 1;

        // Ensure at least one category exists (Category ID 1 is expected by products below)
        if (!DB::table('categories')->where('id', 1)->exists()) {
            DB::table('categories')->insert([
                'id' => 1,
                'name' => 'General',
                'slug' => 'general',
                'parent_id' => 0,
                'level' => 0,
                'order_level' => 0,
                'banner' => null,
                'icon' => null,
                'featured' => 0,
                'top' => 0,
                'digital' => 0,
                'meta_title' => 'General',
                'meta_description' => 'General Category',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Data from productCatalogData.ts
        $products = [
            // ── Thokku (10) ──────────────────────────────────
            [
                'title' => 'Poondu Thokku',
                'tamil_title' => 'பூண்டு தொக்கு',
                'slug' => 'poondu-thokku',
                'category_id' => 1,
                'badge' => 'Bold Favourite',
                'price' => 179,
                'short_description' => 'A bold garlic thokku with rich spice notes and strong homestyle flavour.',
                'chips' => ['Garlicky', 'Bold', 'Traditional', 'Best with dosa'],
                'pair_with' => ['Hot rice', 'Dosa', 'Idli', 'Chapati'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Poondu Thokku is made for garlic lovers who enjoy deep, punchy flavour. Thick, aromatic, and satisfying, it works beautifully with both rice and tiffin.',
                'taste_profile' => 'Bold, garlicky, tangy, spiced.',
                'why_love' => ['Strong garlic-forward flavour', 'Great with dosa and rice', 'Rich, thick consistency', 'Traditional everyday favourite'],
                'image' => 'garlic_thokku.png',
                'tags' => 'thokku,garlic,poondu,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Karuveppilai Thokku',
                'tamil_title' => 'கருவேப்பிலை தொக்கு',
                'slug' => 'karuveppilai-thokku',
                'category_id' => 1,
                'badge' => 'Customer Favourite',
                'price' => 179,
                'short_description' => 'A rich and aromatic curry leaf thokku made in small batches with traditional Tamil flavours.',
                'chips' => ['Herby', 'Traditional', 'Best with rice', 'No Preservatives'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa', 'Curd rice'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Karuveppilai Thokku is a deeply flavourful curry leaf preparation inspired by traditional Tamil kitchens. With its earthy aroma and roasted character, it turns everyday meals into something more satisfying.',
                'taste_profile' => 'Herby, earthy, mildly spicy.',
                'why_love' => ['Classic curry leaf flavour', 'Everyday rice companion', 'Rich roasted aroma', 'Homestyle taste'],
                'image' => 'Curry leaf thokku.png',
                'tags' => 'thokku,curry leaves,karuvepilai,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Pavakai Thokku',
                'tamil_title' => 'பாகற்காய் தொக்கு',
                'slug' => 'pavakai-thokku',
                'category_id' => 1,
                'badge' => 'Traditional',
                'price' => 159,
                'short_description' => 'A bold bitter gourd thokku balanced with spice, tang, and traditional depth.',
                'chips' => ['Bold', 'Traditional', 'Distinctive', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Curd rice', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Pavakai Thokku is made for those who enjoy strong, traditional flavours. It brings the characteristic profile of bitter gourd into a thick, satisfying thokku that pairs well with simple meals.',
                'taste_profile' => 'Bold, tangy, mildly bitter, spiced.',
                'why_love' => ['Distinctive traditional flavour', 'Balanced for everyday enjoyment', 'Thick and satisfying texture', 'Pairs well with rice'],
                'image' => 'pavarkai thokku.png',
                'tags' => 'thokku,bitter gourd,pavakai,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Pirandai Thokku',
                'tamil_title' => 'பிரண்டை தொக்கு',
                'slug' => 'pirandai-thokku',
                'category_id' => 1,
                'badge' => 'Traditional',
                'price' => 199,
                'short_description' => 'A traditional pirandai thokku with distinctive taste and rich homestyle depth.',
                'chips' => ['Traditional', 'Distinctive', 'Homestyle', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Curd rice', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Pirandai Thokku is rooted in traditional food culture and known for its unique flavour profile. Thick and satisfying, it pairs well with simple meals that let its character shine.',
                'taste_profile' => 'Distinctive, earthy, mildly tangy.',
                'why_love' => ['Unique traditional taste', 'Rich texture', 'Pairs well with simple meals', 'Inspired by Tamil home cooking'],
                'image' => 'perandai thokku.png',
                'tags' => 'thokku,pirandai,traditional,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Valaipoo Thokku',
                'tamil_title' => 'வாழைப்பூ தொக்கு',
                'slug' => 'valaipoo-thokku',
                'category_id' => 1,
                'badge' => 'Homestyle',
                'price' => 199,
                'short_description' => 'A banana flower thokku made with authentic Tamil home-style seasoning and rich texture.',
                'chips' => ['Earthy', 'Homestyle', 'Traditional', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Curd rice', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Valaipoo Thokku celebrates the familiar flavour of banana flower in a thick, satisfying Tamil-style accompaniment. It works especially well with simple rice meals and tiffin.',
                'taste_profile' => 'Earthy, savoury, mildly spiced.',
                'why_love' => ['Familiar homestyle taste', 'Rich, thick texture', 'Everyday meal pairing', 'Traditional Tamil inspiration'],
                'image' => 'vazhaipoo thokku.png',
                'tags' => 'thokku,banana flower,valaipoo,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Thakkali Thokku',
                'tamil_title' => 'தக்காளி தொக்கு',
                'slug' => 'thakkali-thokku',
                'category_id' => 1,
                'badge' => 'Daily Favourite',
                'price' => 159,
                'short_description' => 'A tangy and spicy tomato thokku that fits beautifully into everyday meals.',
                'chips' => ['Tangy', 'Everyday', 'Comfort Food', 'Best with dosa'],
                'pair_with' => ['Hot rice', 'Idli', 'Dosa', 'Chapati'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Thakkali Thokku is a classic everyday accompaniment with the familiar tang of tomato and a satisfying spiced finish. It is versatile, crowd-friendly, and easy to enjoy across meals.',
                'taste_profile' => 'Tangy, mildly spicy, comforting.',
                'why_love' => ['Familiar everyday flavour', 'Versatile across meals', 'Great with dosa and rice', 'Comforting homestyle taste'],
                'image' => 'tomato thokku.png',
                'tags' => 'thokku,tomato,thakkali,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Vallarai Thokku',
                'tamil_title' => 'வல்லாரை தொக்கு',
                'slug' => 'vallarai-thokku',
                'category_id' => 1,
                'badge' => 'Wellness Pick',
                'price' => 179,
                'short_description' => 'An earthy and comforting vallarai thokku with familiar homestyle flavour.',
                'chips' => ['Herbal', 'Earthy', 'Traditional', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Curd rice', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Vallarai Thokku is inspired by traditional Tamil kitchens that value earthy, herb-based accompaniments. Its rich texture and gentle flavour make it an easy addition to everyday meals.',
                'taste_profile' => 'Earthy, herbal, comforting.',
                'why_love' => ['Gentle, homestyle flavour', 'Pairs well with everyday meals', 'Traditional recipe inspiration', 'Thick and flavourful'],
                'image' => 'vallarai thokku.png',
                'tags' => 'thokku,vallarai,herbal,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Mallithalai Thokku',
                'tamil_title' => 'மல்லித்தழை தொக்கு',
                'slug' => 'mallithalai-thokku',
                'category_id' => 1,
                'badge' => 'Fresh Favourite',
                'price' => 159,
                'short_description' => 'A fresh coriander thokku with vibrant aroma, mild tang, and homestyle taste.',
                'chips' => ['Fresh', 'Herby', 'Light Tang', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Dosa', 'Idli'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Mallithalai Thokku offers a lively coriander-forward flavour with a fresh aroma and balanced texture. It is ideal when you want something familiar but bright on the palate.',
                'taste_profile' => 'Fresh, herby, gently tangy.',
                'why_love' => ['Bright coriander aroma', 'Light and versatile flavour', 'Easy tiffin pairing', 'Homestyle comfort'],
                'image' => 'malli thokku.png',
                'tags' => 'thokku,coriander,mallithalai,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Chinavangayam Thokku',
                'tamil_title' => 'சின்ன வெங்காய தொக்கு',
                'slug' => 'chinavangayam-thokku',
                'category_id' => 1,
                'badge' => 'Homemade',
                'price' => 179,
                'short_description' => 'A rich and comforting small onion thokku with sweet-spicy depth and homestyle Tamil flavour.',
                'chips' => ['Savory', 'Homestyle', 'Best with dosa', 'Small Batch'],
                'pair_with' => ['Hot rice', 'Dosa', 'Curd rice', 'Chapati'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Chinavangayam Thokku brings together the rich taste of small onions in a thick, flavourful Tamil-style preparation. It adds a comforting, homestyle touch to simple meals and works beautifully as an everyday side.',
                'taste_profile' => 'Savory, mildly sweet, gently spiced.',
                'why_love' => ['Rich onion-forward flavour', 'Pairs well with rice and tiffin', 'Easy everyday meal companion', 'Inspired by Tamil home cooking'],
                'image' => 'chinnavengayam thokku.png',
                'tags' => 'thokku,small onion,vengayam,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Kovakkai Thokku',
                'tamil_title' => 'கோவக்காய் தொக்கு',
                'slug' => 'kovakkai-thokku',
                'category_id' => 1,
                'badge' => 'Everyday Pick',
                'price' => 179,
                'short_description' => 'A mildly spiced ivy gourd thokku with rustic character and everyday appeal.',
                'chips' => ['Mild Spice', 'Rustic', 'Homestyle', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Chapati', 'Curd rice'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Kovakkai Thokku is an easy, versatile accompaniment that brings a gentle spice and rustic flavour to everyday meals. It is simple, satisfying, and rooted in homestyle cooking.',
                'taste_profile' => 'Mildly spiced, savoury, rustic.',
                'why_love' => ['Easy everyday pairing', 'Balanced flavour', 'Thick and satisfying', 'Familiar homestyle taste'],
                'image' => 'kovakai thokku.png',
                'tags' => 'thokku,ivy gourd,kovakkai,pickle',
                'weight' => '250g'
            ],
            [
                'title' => 'Venthayakeerai Thokku',
                'tamil_title' => 'வெந்தயக்கீரை தொக்கு',
                'slug' => 'venthayakeerai-thokku',
                'category_id' => 1,
                'badge' => 'Traditional',
                'price' => 179,
                'short_description' => 'A nutritious fenugreek leaf thokku with balanced bitterness and rich Tamil seasoning.',
                'chips' => ['Nutritious', 'Unique', 'Homestyle', 'Best with rice'],
                'pair_with' => ['Hot rice', 'Curd rice', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Venthayakeerai Thokku brings the distinct flavour of fenugreek leaves into a satisfying, spiced accompaniment. Rooted in traditional home-style cooking.',
                'taste_profile' => 'Mildly bitter, savoury, aromatic.',
                'why_love' => ['Unique traditional taste', 'Nutritious leafy base', 'Pairs well with curd rice', 'Homestyle appeal'],
                'image' => 'venthayakeerai thokku.png',
                'tags' => 'thokku,fenugreek,venthayakeerai,pickle',
                'weight' => '250g'
            ],

            // ── Urukai (3) ───────────────────────────────────
            [
                'title' => 'Lemon Urukai',
                'tamil_title' => 'எலுமிச்சை ஊறுகாய்',
                'slug' => 'lemon-urukai',
                'category_id' => 2,
                'badge' => 'Customer Favourite',
                'price' => 149,
                'short_description' => 'A zesty lemon pickle with deep tanginess and bold homestyle flavour.',
                'chips' => ['Zesty', 'Tangy', 'Traditional', 'Best with curd rice'],
                'pair_with' => ['Curd rice', 'Hot rice', 'Chapati'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Lemon Urukai is a pantry classic that delivers a bright, tangy kick to everyday meals. Marinated with rock salt, chili powder, and traditional spices, it is bold, familiar, and easy to enjoy as a regular side.',
                'taste_profile' => 'Zesty, tangy, punchy.',
                'why_love' => ['Strong, familiar tang', 'Great with curd rice', 'Pantry-friendly favourite', 'Homestyle Tamil taste'],
                'image' => 'lemon pickle.png',
                'tags' => 'urukai,lemon,pickle,elumichai',
                'weight' => '250g'
            ],
            [
                'title' => 'Narthangai Urukai',
                'tamil_title' => 'நார்த்தங்காய் ஊறுகாய்',
                'slug' => 'narthangai-urukai',
                'category_id' => 2,
                'badge' => 'Traditional',
                'price' => 149,
                'short_description' => 'A bold citron pickle with sharp citrus character and traditional spicy depth.',
                'chips' => ['Citrusy', 'Traditional', 'Tangy', 'Meal Booster'],
                'pair_with' => ['Curd rice', 'Hot rice', 'Simple meals'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Narthangai Urukai is known for its bold citrus profile and sharp, memorable finish. Marinated with mustard, fenugreek, and cold-pressed oil, it adds punch and brightness to simple meals and is especially enjoyable with curd rice.',
                'taste_profile' => 'Sharp, tangy, citrusy, spiced.',
                'why_love' => ['Bright citrus flavour', 'Strong traditional character', 'Pairs perfectly with curd rice', 'Bold meal accompaniment'],
                'image' => 'narthangai pickle.png',
                'tags' => 'urukai,citron,pickle,narthangai',
                'weight' => '250g'
            ],
            [
                'title' => 'Maangai Urukai',
                'tamil_title' => 'மாங்காய் ஊறுகாய்',
                'slug' => 'maangai-urukai',
                'category_id' => 2,
                'badge' => 'Best Seller',
                'price' => 149,
                'short_description' => 'A classic mango pickle with bold spice, rich tang, and irresistible traditional punch.',
                'chips' => ['Tangy', 'Best Seller', 'Authentic', 'Everyday Side'],
                'pair_with' => ['Curd rice', 'Hot rice', 'Dosa', 'Tiffin'],
                'storage' => 'Store in a cool, dry place. Use a dry spoon. Refrigerate after opening if needed.',
                'about' => 'Maangai Urukai is a timeless Tamil favourite that brings bold tanginess and spice to everyday meals. Made with sun-dried raw mangoes, mustard seeds, fenugreek, and cold-pressed gingelly oil, it adds instant character to rice, curd rice, and tiffin plates.',
                'taste_profile' => 'Tangy, spicy, bold.',
                'why_love' => ['Classic pickle taste', 'Great with everyday meals', 'Full of familiar tang', 'Traditional Tamil favourite'],
                'image' => 'manga pickle.png',
                'tags' => 'urukai,mango,pickle,manga',
                'weight' => '250g'
            ],

            // ── Podi (14) ────────────────────────────────────
            [
                'title' => 'Idly Podi',
                'tamil_title' => 'இட்லி பொடி',
                'slug' => 'idly-podi',
                'category_id' => 3,
                'badge' => 'Everyday Essential',
                'price' => 99,
                'short_description' => 'A classic roasted spice powder that pairs perfectly with hot idli, dosa, and a drizzle of sesame oil.',
                'chips' => ['Classic', 'Everyday', 'Best with idli', 'Roasted'],
                'pair_with' => ['Idli', 'Dosa', 'Hot rice & ghee'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Idly Podi is the quintessential South Indian breakfast companion. Roasted lentils and red chillies ground to a coarse, flavourful powder that transforms soft idlis and crispy dosas into a satisfying meal when paired with sesame oil or ghee.',
                'taste_profile' => 'Roasted, mildly spicy, nutty.',
                'why_love' => ['Timeless breakfast favourite', 'Perfect with idli and dosa', 'Coarse-ground for texture', 'Simple, satisfying flavour'],
                'image' => '', // Placeholder
                'tags' => 'podi,idli,milagai podi',
                'weight' => '150g'
            ],
            [
                'title' => 'Paruppu Podi',
                'tamil_title' => 'பருப்பு பொடி',
                'slug' => 'paruppu-podi',
                'category_id' => 3,
                'badge' => 'Classic Essential',
                'price' => 99,
                'short_description' => 'A classic lentil podi with comforting South Indian flavour and everyday versatility.',
                'chips' => ['Classic', 'Comfort Food', 'Best with ghee rice', 'Everyday'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Paruppu Podi is a beloved everyday staple known for its simple, satisfying flavour. Mixed with hot rice and ghee, it brings instant comfort to the table.',
                'taste_profile' => 'Comforting, roasted, mildly spiced.',
                'why_love' => ['Timeless pantry essential', 'Perfect with ghee rice', 'Great for quick meals', 'Familiar South Indian taste'],
                'image' => 'paruppu-podi.png',
                'tags' => 'podi,dal,paruppu,ghee rice',
                'weight' => '150g'
            ],
            [
                'title' => 'Poondu Podi',
                'tamil_title' => 'பூண்டு பொடி',
                'slug' => 'poondu-podi',
                'category_id' => 3,
                'badge' => 'Bold Pick',
                'price' => 109,
                'short_description' => 'A bold garlic podi with strong aroma and rich roasted flavour.',
                'chips' => ['Garlicky', 'Bold', 'Roasted', 'Best with idli'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Poondu Podi is for garlic lovers who want quick flavour and a punchier everyday podi. It adds depth to simple breakfasts and rice meals with minimal effort.',
                'taste_profile' => 'Garlicky, bold, roasted.',
                'why_love' => ['Strong garlic flavour', 'Great flavour booster', 'Easy breakfast pairing', 'Comforting pantry staple'],
                'image' => 'poondu-podi.png',
                'tags' => 'podi,garlic,poondu',
                'weight' => '150g'
            ],
            [
                'title' => 'Karuveppilai Podi',
                'tamil_title' => 'கருவேப்பிலை பொடி',
                'slug' => 'karuveppilai-podi',
                'category_id' => 3,
                'badge' => 'Customer Favourite',
                'price' => 109,
                'short_description' => 'A curry leaf podi with earthy depth, roasted aroma, and everyday comfort.',
                'chips' => ['Herby', 'Roasted', 'Best with rice', 'Traditional'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Karuveppilai Podi offers the comfort of curry leaf flavour in an easy-to-use everyday podi. Its earthy aroma and roasted notes make it ideal for both breakfast and lunch pairings.',
                'taste_profile' => 'Herby, earthy, roasted.',
                'why_love' => ['Easy everyday use', 'Great with rice or idli', 'Rich curry leaf aroma', 'Traditional Tamil flavour'],
                'image' => 'karuvepillai-podi.png',
                'tags' => 'podi,curry leaves,karuveppilai',
                'weight' => '150g'
            ],
            [
                'title' => 'Nilakadalai Podi',
                'tamil_title' => 'நிலக்கடலை பொடி',
                'slug' => 'nilakadalai-podi',
                'category_id' => 3,
                'badge' => 'Family Favourite',
                'price' => 119,
                'short_description' => 'A rich peanut podi with nutty flavour, mild spice, and broad family appeal.',
                'chips' => ['Nutty', 'Mild Spice', 'Family Favourite', 'Best with idli'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Nilakadalai Podi is a comforting, nutty podi that works well for all age groups. Its mild spice and rounded flavour make it a versatile addition to breakfast and lunch.',
                'taste_profile' => 'Nutty, mild, roasted.',
                'why_love' => ['Broad family appeal', 'Great with idli and dosa', 'Mild and comforting', 'Rich peanut flavour'],
                'image' => 'nilakadalai-podi.png',
                'tags' => 'podi,peanut,groundnut,nilakadalai',
                'weight' => '150g'
            ],
            [
                'title' => 'Ellu Podi',
                'tamil_title' => 'எள்ளு பொடி',
                'slug' => 'ellu-podi',
                'category_id' => 3,
                'badge' => 'Everyday Essential',
                'price' => 129,
                'short_description' => 'A roasted sesame podi with nutty aroma and rich, comforting flavour.',
                'chips' => ['Nutty', 'Classic', 'Best with idli', 'Ghee Rice Friendly'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Ellu Podi is a warm, nutty spice powder that turns simple meals into comforting favourites. It is especially delicious with hot rice and ghee or with idli and dosa.',
                'taste_profile' => 'Nutty, roasted, mildly spiced.',
                'why_love' => ['Rich sesame aroma', 'Great with ghee rice', 'Quick everyday flavour boost', 'Pantry staple'],
                'image' => 'ellu-podi.png',
                'tags' => 'podi,sesame,ellu',
                'weight' => '150g'
            ],
            [
                'title' => 'Kollu Podi',
                'tamil_title' => 'கொள்ளு பொடி',
                'slug' => 'kollu-podi',
                'category_id' => 3,
                'badge' => 'Rustic Favourite',
                'price' => 119,
                'short_description' => 'A robust horse gram podi with rustic flavour and everyday meal appeal.',
                'chips' => ['Rustic', 'Protein-rich', 'Traditional', 'Best with rice'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Kollu Podi is valued for its rustic depth and comforting familiarity. It is an easy way to add bold traditional flavour to hot rice and simple tiffin.',
                'taste_profile' => 'Rustic, roasted, mildly bold.',
                'why_love' => ['Strong traditional character', 'Great on hot rice', 'Everyday pantry favourite', 'Satisfying roasted flavour'],
                'image' => 'kollu-podi.png',
                'tags' => 'podi,horse gram,kollu',
                'weight' => '150g'
            ],
            [
                'title' => 'Murungai Podi',
                'tamil_title' => 'முருங்கை பொடி',
                'slug' => 'murungai-podi',
                'category_id' => 3,
                'badge' => 'Nutritious Pick',
                'price' => 129,
                'short_description' => 'A flavourful moringa podi with leafy depth and traditional everyday comfort.',
                'chips' => ['Leafy', 'Traditional', 'Best with rice', 'Nutritious'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Murungai Podi brings the familiar character of moringa into a versatile podi that fits neatly into daily meals. It is easy to use, comforting, and full of traditional appeal.',
                'taste_profile' => 'Leafy, savoury, roasted.',
                'why_love' => ['Easy daily pairing', 'Traditional moringa flavour', 'Great with hot rice', 'Pantry-friendly option'],
                'image' => 'murungai-keerai-podi.png',
                'tags' => 'podi,moringa,murungai',
                'weight' => '150g'
            ],
            [
                'title' => 'Pirandai Podi',
                'tamil_title' => 'பிரண்டை பொடி',
                'slug' => 'pirandai-podi',
                'category_id' => 3,
                'badge' => 'Traditional',
                'price' => 129,
                'short_description' => 'A traditional pirandai podi with distinctive flavour and homestyle depth.',
                'chips' => ['Traditional', 'Distinctive', 'Best with rice', 'Roasted'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Pirandai Podi is made for those who enjoy unique traditional flavours with strong identity. It is deeply rooted in familiar food culture and easy to enjoy in simple meals.',
                'taste_profile' => 'Distinctive, roasted, earthy.',
                'why_love' => ['Unique traditional taste', 'Versatile across meals', 'Great with hot rice', 'Homestyle character'],
                'image' => 'pirandai-podi.png',
                'tags' => 'podi,pirandai,traditional',
                'weight' => '150g'
            ],
            [
                'title' => 'Vallarai Podi',
                'tamil_title' => 'வல்லாரை பொடி',
                'slug' => 'vallarai-podi',
                'category_id' => 3,
                'badge' => 'Wellness Pick',
                'price' => 129,
                'short_description' => 'An earthy vallarai podi with gentle flavour and traditional everyday appeal.',
                'chips' => ['Earthy', 'Herbal', 'Traditional', 'Best with rice'],
                'pair_with' => ['Hot rice & ghee', 'Idli', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Vallarai Podi is a simple, earthy podi designed for everyday convenience and traditional flavour. It works especially well when you want a familiar, balanced accompaniment for quick meals.',
                'taste_profile' => 'Earthy, herbal, mild.',
                'why_love' => ['Gentle flavour profile', 'Easy to use daily', 'Traditional inspiration', 'Great with hot rice'],
                'image' => 'vallarai-podi.png',
                'tags' => 'podi,vallarai,herbal',
                'weight' => '150g'
            ],
            [
                'title' => 'Sambar Podi',
                'tamil_title' => 'சாம்பார் பொடி',
                'slug' => 'sambar-podi',
                'category_id' => 3,
                'badge' => 'Kitchen Essential',
                'price' => 149,
                'short_description' => 'A traditional sambar powder blend with aromatic spices for rich, homestyle sambar.',
                'chips' => ['Aromatic', 'Kitchen Essential', 'Traditional', 'Freshly Ground'],
                'pair_with' => ['Idli', 'Dosa', 'Rice', 'Vada'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Sambar Podi is a fragrant blend of roasted coriander, cumin, fenugreek, red chillies, and lentils that forms the heart of every South Indian sambar. Freshly ground in small batches to preserve aroma and potency.',
                'taste_profile' => 'Aromatic, warm, mildly spicy.',
                'why_love' => ['Essential for everyday sambar', 'Freshly ground aroma', 'Authentic spice blend', 'Small batch quality'],
                'image' => 'sambar-podi.png',
                'tags' => 'podi,sambar,masala',
                'weight' => '150g'
            ],
            [
                'title' => 'Pulikulambu Podi',
                'tamil_title' => 'புளிக்குழம்பு பொடி',
                'slug' => 'pulikulambu-podi',
                'category_id' => 3,
                'badge' => 'Traditional',
                'price' => 149,
                'short_description' => 'A traditional spice mix for making rich, tangy pulikulambu with authentic Tamil flavour.',
                'chips' => ['Tangy', 'Traditional', 'Rice Companion', 'Freshly Ground'],
                'pair_with' => ['Hot rice', 'Appalam', 'Curd rice'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Pulikulambu Podi is a carefully crafted spice blend designed for the beloved Tamil tamarind curry. With the right balance of heat, tang, and warmth, it makes preparing authentic pulikulambu effortless.',
                'taste_profile' => 'Tangy, warm, boldly spiced.',
                'why_love' => ['Makes pulikulambu effortless', 'Balanced heat and tang', 'Traditional recipe base', 'Rich, deep flavour'],
                'image' => 'puli-kulambhu-podi.png',
                'tags' => 'podi,pulikulambu,tamarind curry',
                'weight' => '150g'
            ],
            [
                'title' => 'Karikulambu Podi',
                'tamil_title' => 'கறிக்குழம்பு பொடி',
                'slug' => 'karikulambu-podi',
                'category_id' => 3,
                'badge' => 'Homestyle',
                'price' => 149,
                'short_description' => 'A robust spice mix for traditional Tamil karikulambu with deep, smoky character.',
                'chips' => ['Smoky', 'Bold', 'Traditional', 'Rice Companion'],
                'pair_with' => ['Hot rice', 'Appalam', 'Dosa'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Karikulambu Podi is a bold, deeply roasted spice blend crafted for the iconic Tamil black curry. Its smoky, robust character brings authentic depth to this beloved everyday dish.',
                'taste_profile' => 'Smoky, bold, deeply roasted.',
                'why_love' => ['Authentic karikulambu base', 'Deep smoky flavour', 'Bold traditional character', 'Easy preparation'],
                'image' => 'black-curry-podi.png',
                'tags' => 'podi,karikulambu,black curry',
                'weight' => '150g'
            ],
            [
                'title' => 'Rasa Podi',
                'tamil_title' => 'ரசப் பொடி',
                'slug' => 'rasa-podi',
                'category_id' => 3,
                'badge' => 'Kitchen Essential',
                'price' => 149,
                'short_description' => 'A traditional rasam powder with pepper, cumin, and warm spices for comforting everyday rasam.',
                'chips' => ['Peppery', 'Aromatic', 'Comfort Food', 'Freshly Ground'],
                'pair_with' => ['Hot rice', 'As soup', 'Simple meals'],
                'storage' => 'Store in a cool, dry place. Keep tightly sealed. Use a dry spoon.',
                'about' => 'Rasa Podi is a classic pepper-forward rasam powder that makes preparing comforting South Indian rasam quick and easy. Ground fresh with black pepper, cumin, coriander, and a touch of garlic for warmth.',
                'taste_profile' => 'Peppery, warm, aromatic.',
                'why_love' => ['Essential for everyday rasam', 'Warm, comforting flavour', 'Freshly ground spices', 'Quick meal preparation'],
                'image' => 'rasam-podi.png',
                'tags' => 'podi,rasam,rasa podi',
                'weight' => '150g'
            ],
        ];

        foreach ($products as $p) {
            // Handle Image Registration
            $uploadId = null;
            if (isset($p['image'])) {
                $imagePath = 'public/uploads/all/legacy-storefront/' . $p['image'];
                $destPath = 'public/uploads/all/' . $p['image'];

                // Copy to main uploads folder if not already there
                if (!file_exists(base_path($destPath)) && file_exists(base_path($imagePath))) {
                    copy(base_path($imagePath), base_path($destPath));
                }

                if (file_exists(base_path($destPath))) {
                    $fileSize = filesize(base_path($destPath));
                    $ext = pathinfo($destPath, PATHINFO_EXTENSION);

                    $uploadId = DB::table('uploads')->insertGetId([
                        'file_original_name' => pathinfo($p['image'], PATHINFO_FILENAME),
                        'file_name' => 'uploads/all/' . $p['image'],
                        'user_id' => $adminId,
                        'extension' => $ext,
                        'type' => 'image',
                        'file_size' => $fileSize,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }

            // Dual Name Format: Tamil / English
            $fullName = $p['tamil_title'] . ' / ' . $p['title'];

            $productId = DB::table('products')->insertGetId([
                'name' => $fullName,
                'tamil_name' => $p['tamil_title'],
                'added_by' => 'admin',
                'user_id' => $adminId,
                'category_id' => $p['category_id'],
                'brand_id' => null,
                'photos' => $uploadId ? json_encode([$uploadId]) : '[]',
                'thumbnail_img' => $uploadId,
                'tags' => $p['tags'] ?? '',
                'description' => $p['about'], // Full about text as description
                'unit_price' => $p['price'],
                'purchase_price' => round($p['price'] * 0.6, 2),
                'variant_product' => 0,
                'attributes' => '[]',
                'choice_options' => '[]',
                'colors' => '[]',
                'published' => 1,
                'approved' => 1,
                'cash_on_delivery' => 1,
                'featured' => in_array($p['badge'], ['Customer Favourite', 'Best Seller', 'Bold Favourite']) ? 1 : 0,
                'current_stock' => 500,
                'unit' => $p['weight'],
                'weight' => (int) str_replace('g', '', $p['weight']),
                'min_qty' => 1,
                'low_stock_quantity' => 10,
                'slug' => $p['slug'],
                'rating' => 4.8,

                // New Rich Fields
                'badge' => $p['badge'],
                'chips' => json_encode($p['chips']),
                'taste_profile' => $p['taste_profile'],
                'pair_with' => json_encode($p['pair_with']),
                'about' => $p['about'],
                'why_love' => json_encode($p['why_love']),
                'storage' => $p['storage'],
                'is_premium' => 1,

                'meta_title' => $p['title'] . ' | Dhanvanthiri Foods',
                'meta_description' => $p['short_description'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Product stock entry
            DB::table('product_stocks')->insert([
                'product_id' => $productId,
                'variant' => '',
                'sku' => 'DV-' . strtoupper(substr($p['slug'], 0, 3)) . '-' . $productId,
                'price' => $p['price'],
                'qty' => 500,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Category pivot
            DB::table('product_categories')->insert([
                'product_id' => $productId,
                'category_id' => $p['category_id'],
            ]);
        }

        if ($this->command) {
            $this->command->info('Dhanvathiri products seeded with RICH METADATA from storefront source.');
        } else {
            dump('Dhanvathiri products seeded with RICH METADATA from storefront source.');
        }
    }
}