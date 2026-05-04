<?php
$content = file_get_contents('v:\pers\Freelance\Dhanvathiri_v2\app\Http\Helpers.php');

$search1 = "\$carrier_price = \$carrier_range->carrier_range_prices->where('zone_id', \$user_zone)->first()->price;";
$replace1 = "\$rangePrice = \$carrier_range->carrier_range_prices->where('zone_id', \$user_zone)->first();
                if (!\$rangePrice) return 0;
                \$carrier_price = \$rangePrice->price;";

$newContent = str_replace($search1, $replace1, $content);

if ($newContent !== $content) {
    file_put_contents('v:\pers\Freelance\Dhanvathiri_v2\app\Http\Helpers.php', $newContent);
    echo "Successfully added safety checks to Helpers.php\n";
} else {
    echo "Could not find search string in Helpers.php\n";
}
