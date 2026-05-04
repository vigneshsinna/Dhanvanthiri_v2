<?php
$file = 'frontend/src/features/payment/pages/OrderConfirmationPage.tsx';
$content = file_get_contents($file);

$search = <<<EOT
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {isAuthenticated ? (
          <Link to="/account/orders">
            <Button variant="primary">{t('View My Orders', 'à®Žà®©¯ à®†à®°¯à®Ÿà®°¯à®•à®³¯ˆ à®ªà®¾à®°¯')}</Button>
          </Link>
        ) : (
          <Link to="/track-order">
            <Button variant="primary">{t('Track Order', 'à®†à®°¯à®Ÿà®°¯ˆ à®•à®£¯à®•à®¾à®£à®¿')}</Button>
          </Link>
        )}
        <Link to="/products">
EOT;

// I'll just use regex to ignore the exact tamil string
$content = preg_replace('/\{isAuthenticated \? \([\s\S]*?\) : \([\s\S]*?\)\}/', '{isAuthenticated && (
          <Link to="/account/orders">
            <Button variant="primary">{t(\'View My Orders\', \'à®Žà®©à¯  à®†à®°à¯ à®Ÿà®°à¯ à®•à®³à¯ˆ à®ªà®¾à®°à¯ \')}</Button>
          </Link>
        )}', $content);

file_put_contents($file, $content);
echo "Done";
