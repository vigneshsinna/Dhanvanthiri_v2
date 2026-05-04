<?php
$content = file_get_contents('v:\pers\Freelance\Dhanvathiri_v2\app\Http\Helpers.php');

$search = "if (\$user_zone == 0 && !empty(\$shipping_info['country_id']) && \$shipping_info['country_id'] != 0) {";
$insertion = "if (\$user_zone == 0 && !empty(\$shipping_info['state_id'])) {
            \$shippingState = State::where('id', \$shipping_info['state_id'])->first();
            if (\$shippingState && \$shippingState->zone_id) {
                \$user_zone = \$shippingState->zone_id;
            }
        }\n\n        ";

if (strpos($content, $insertion) !== false) {
    echo "Already inserted\n";
} else {
    $newContent = str_replace($search, $insertion . $search, $content);
    if ($newContent !== $content) {
        file_put_contents('v:\pers\Freelance\Dhanvathiri_v2\app\Http\Helpers.php', $newContent);
        echo "Successfully updated Helpers.php\n";
    } else {
        echo "Could not find search string in Helpers.php\n";
        // Try a more relaxed search if needed
    }
}
