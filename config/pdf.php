<?php

$fontPath = base_path('public/assets/fonts/');
$fontData = [
    'roboto' => [
        'R'  => 'Roboto-Regular.ttf',    // regular font
        'useOTL' => 0xFF,    // required for complicated langs like Persian, Arabic and Chinese
        'useKashida' => 75,  // required for complicated langs like Persian, Arabic and Chinese
    ],
    'hindsiliguri' => [
        'R'  => 'HindSiliguri-Regular.ttf',    // regular font
        'useOTL' => 0xFF,    // required for complicated langs like Persian, Arabic and Chinese
        'useKashida' => 75,  // required for complicated langs like Persian, Arabic and Chinese
    ],
    'arnamu' => [
        'R'  => 'arnamu.ttf',    // regular font
        'useOTL' => 0xFF,    // required for complicated langs like Persian, Arabic and Chinese
        'useKashida' => 75,  // required for complicated langs like Persian, Arabic and Chinese
    ],
    'varelaround' => [
        'R'  => 'VarelaRound-Regular.ttf',    // regular font
        'useOTL' => 0xFF,    // required for complicated langs like Persian, Arabic and Chinese
        'useKashida' => 75,  // required for complicated langs like Persian, Arabic and Chinese
    ],
    'hanuman' => [
        'R'  => 'Hanuman-Regular.ttf',    // regular font
        'useOTL' => 0xFF,    // required for complicated langs like Persian, Arabic and Chinese
        'useKashida' => 75,  // required for complicated langs like Persian, Arabic and Chinese
    ],
    'kanit' => [
        'R'  => 'Kanit-Regular.ttf',    // regular font
    ],
    'yahei' => [
        'R'  => 'chinese-msyh.ttf',    // regular font
    ],
    'pyidaungsu' => [
        'R'  => 'Pyidaungsu.ttf',    // regular font
    ],
    'zawgyi-one' => [
        'R'  => 'Zawgyi-One.ttf',    // regular font
    ],
];

if (is_file($fontPath . 'NotoSansTamil-Regular.ttf')) {
    $fontData['notosanstamil'] = [
        'R'  => 'NotoSansTamil-Regular.ttf',
        'B'  => is_file($fontPath . 'NotoSansTamil-Bold.ttf') ? 'NotoSansTamil-Bold.ttf' : 'NotoSansTamil-Regular.ttf',
        'useOTL' => 0xFF,
        'useKashida' => 75,
    ];
}

return
    [
        'mode'                  => 'utf-8',
        'format'                => 'A4',
        'author'                => '',
        'subject'               => '',
        'keywords'              => '',
        'creator'               => 'Laravel Pdf',
        'display_mode'          => 'fullpage',
        'tempDir'               => base_path('temp/'),
        'font_path' => $fontPath,
        'font_data' => $fontData,
    ];
