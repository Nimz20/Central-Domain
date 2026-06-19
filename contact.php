<?php
declare(strict_types=1);

header('X-Robots-Tag: noindex, nofollow', true);

const MAIL_TO = 'info@centraldomain.co.za';
const MAIL_FROM = 'no-reply@centraldomain.co.za';

function wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    return strpos($accept, 'application/json') !== false || strtolower($requestedWith) === 'fetch';
}

function post_value(string $key): string
{
    $value = $_POST[$key] ?? '';
    if (is_array($value)) {
        return '';
    }
    return trim((string) $value);
}

function clean_line(string $value, int $maxLength = 180): string
{
    $value = preg_replace('/[\r\n\t]+/', ' ', $value) ?? '';
    $value = preg_replace('/\s{2,}/', ' ', $value) ?? '';
    return trim(substr($value, 0, $maxLength));
}

function clean_message(string $value, int $maxLength = 3000): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[^\P{C}\n\t]+/u', '', $value) ?? '';
    return trim(substr($value, 0, $maxLength));
}

function respond(bool $ok, string $message, int $status = 200): void
{
    http_response_code($status);

    if (wants_json()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
        exit;
    }

    $title = $ok ? 'Enquiry sent' : 'Enquiry not sent';
    $escapedTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    $escapedMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

    header('Content-Type: text/html; charset=UTF-8');
    echo '<!doctype html><html lang="en-ZA"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>' . $escapedTitle . ' | Central Domain</title>';
    echo '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071426;color:#f1f6ef;font-family:Arial,sans-serif}.card{max-width:620px;padding:32px;border:1px solid rgba(25,230,109,.35);border-radius:14px;background:rgba(8,24,45,.86)}a{color:#19e66d;font-weight:700}</style>';
    echo '</head><body><main class="card"><h1>' . $escapedTitle . '</h1><p>' . $escapedMessage . '</p><p><a href="/">Back to Central Domain</a></p></main></body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Please send enquiries from the contact form.', 405);
}

if (post_value('company') !== '') {
    respond(true, 'Thanks, your enquiry has been sent.');
}

$name = clean_line(post_value('name'));
$contact = clean_line(post_value('contact'));
$website = clean_line(post_value('website'), 260);
$service = clean_line(post_value('service'));
$source = clean_line(post_value('source'), 120);
$page = clean_line(post_value('page'), 260);
$message = clean_message(post_value('message'));

if ($name === '' || $contact === '' || $service === '' || $message === '') {
    respond(false, 'Please complete your name, contact detail, service choice and message.', 422);
}

if (strlen($name) < 2 || strlen($contact) < 4 || strlen($message) < 12) {
    respond(false, 'Please add a little more detail so we can reply properly.', 422);
}

if ($website !== '' && filter_var($website, FILTER_VALIDATE_URL) === false) {
    respond(false, 'Please enter the website as a full URL, starting with https://', 422);
}

$replyTo = MAIL_TO;
if (strpos($contact, '@') !== false && filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $replyTo = $contact;
}

$subject = 'Central Domain enquiry - ' . $service;
$subject = clean_line($subject, 140);

$ip = clean_line($_SERVER['REMOTE_ADDR'] ?? 'Unknown', 80);
$userAgent = clean_line($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 240);

$bodyLines = [
    'New Central Domain website enquiry',
    '',
    'Name: ' . $name,
    'Email or phone: ' . $contact,
    'Website: ' . ($website !== '' ? $website : 'Not provided'),
    'Need: ' . $service,
    'Source: ' . ($source !== '' ? $source : 'Website contact form'),
    'Page: ' . ($page !== '' ? $page : 'Not provided'),
    '',
    'Message:',
    $message,
    '',
    'Technical:',
    'IP: ' . $ip,
    'User agent: ' . $userAgent,
];

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Central Domain Website <' . MAIL_FROM . '>',
    'Reply-To: ' . clean_line($replyTo, 180),
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail(MAIL_TO, $subject, implode("\n", $bodyLines), implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$sent) {
    respond(false, 'The form could not send right now. Please WhatsApp us or email info@centraldomain.co.za.', 500);
}

respond(true, 'Thanks, your enquiry has been sent. We will reply within one working day.');
