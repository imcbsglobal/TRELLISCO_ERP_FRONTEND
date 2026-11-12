<?php
/**
 * Trellisco ERP — credentials mail relay.
 *
 * A browser cannot open an SMTP connection, so this file is the one piece that
 * talks to Hostinger (smtp.hostinger.com:465) and turns the SPA's POST into an
 * email. Upload it next to nothing else — it has no dependencies.
 *
 *   POST /mailer/send.php
 *   { "to": "client@example.com", "cc": "info@imcbs.com",
 *     "subject": "...", "body": "...", "from": "info@imcbs.com" }
 *
 * Replies `{"ok":true,...}` or `{"ok":false,"error":"..."}` with CORS headers.
 * Requires the token below in `Authorization: Bearer <token>` or `X-Mail-Token`.
 */

declare(strict_types=1);

// ─── Configuration ───────────────────────────────────────────────────────────
const SMTP_HOST      = 'smtp.hostinger.com';
const SMTP_PORT      = 465;                 // implicit TLS
const SMTP_USER      = 'info@imcbs.com';    // mailbox that authenticates
const SMTP_PASS      = 'Apple@9645#';       // mailbox password (change here)
const MAIL_FROM      = 'info@imcbs.com';    // visible From address
const MAIL_FROM_NAME = 'Trellisco ERP';
const MAIL_REPLY_TO  = 'info@imcbs.com';

// Shared secret. Must match VITE_MAIL_API_TOKEN in the frontend .env.
const API_TOKEN = 'trm_9f4c2b7e6a1d3850c9b4e7f2a6d8c1b3';

// The SPA origins allowed to call this endpoint. localhost is always allowed.
const ALLOWED_ORIGINS = [
    'https://trelliscoerp.com',
    'https://www.trelliscoerp.com',
    'https://imcbs.com',
    'https://www.imcbs.com',
];

const MAX_BODY_BYTES = 65536;

// ─── HTTP plumbing ───────────────────────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$localPreview = preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) === 1;
if ($origin !== '' && (in_array($origin, ALLOWED_ORIGINS, true) || $localPreview)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Mail-Token');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/** Sends a JSON reply and stops. */
function respond(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Use POST.']);
}

// ─── Authentication ──────────────────────────────────────────────────────────
$presented = '';
if (preg_match('/^Bearer\s+(.+)$/i', $_SERVER['HTTP_AUTHORIZATION'] ?? '', $match) === 1) {
    $presented = trim($match[1]);
} elseif (!empty($_SERVER['HTTP_X_MAIL_TOKEN'])) {
    $presented = trim((string) $_SERVER['HTTP_X_MAIL_TOKEN']);
}

if ($presented === '' || !hash_equals(API_TOKEN, $presented)) {
    respond(401, ['ok' => false, 'error' => 'Missing or invalid relay token.']);
}

// ─── Input ───────────────────────────────────────────────────────────────────
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
    respond(413, ['ok' => false, 'error' => 'Request body is empty or too large.']);
}

$input = json_decode($raw, true);
if (!is_array($input)) {
    respond(400, ['ok' => false, 'error' => 'Request body must be valid JSON.']);
}

/** Strips CR/LF so a header can never be injected through a field. */
function headerSafe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $value));
}

$to = headerSafe((string) ($input['to'] ?? ''));
$cc = headerSafe((string) ($input['cc'] ?? ''));
$subject = headerSafe((string) ($input['subject'] ?? ''));
$body = (string) ($input['body'] ?? '');
$replyTo = headerSafe((string) ($input['reply_to'] ?? MAIL_REPLY_TO));

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'A valid "to" address is required.']);
}
$recipients = [$to];
if ($cc !== '') {
    foreach (preg_split('/[,;]+/', $cc) ?: [] as $candidate) {
        $candidate = headerSafe($candidate);
        if ($candidate === '') {
            continue;
        }
        if (!filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
            respond(422, ['ok' => false, 'error' => 'Invalid Cc address: ' . $candidate]);
        }
        $recipients[] = $candidate;
    }
}
$recipients = array_values(array_unique($recipients));

if ($subject === '') {
    $subject = 'Your Trellisco T-ERP login details';
}
if (trim($body) === '') {
    respond(422, ['ok' => false, 'error' => 'The message body is empty.']);
}
if (!filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    $replyTo = MAIL_REPLY_TO;
}

// ─── Message ─────────────────────────────────────────────────────────────────
$messageId = bin2hex(random_bytes(8)) . '@imcbs.com';
$headers = [
    'Date: ' . date('r'),
    'From: ' . sprintf('"%s" <%s>', MAIL_FROM_NAME, MAIL_FROM),
    'To: ' . $to,
];
if ($cc !== '') {
    $headers[] = 'Cc: ' . $cc;
}
$headers[] = 'Reply-To: ' . $replyTo;
// RFC 2047 so non-ASCII company names survive.
$headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
$headers[] = 'Message-ID: <' . $messageId . '>';
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset="UTF-8"';
$headers[] = 'Content-Transfer-Encoding: base64';
$headers[] = 'X-Mailer: Trellisco ERP relay';

$message = implode("\r\n", $headers)
    . "\r\n\r\n"
    . chunk_split(base64_encode(str_replace(["\r\n", "\r"], "\n", $body)), 76, "\r\n");

// ─── SMTP ────────────────────────────────────────────────────────────────────
/** Reads one (possibly multi-line) SMTP reply and returns its status code. */
function smtpRead($socket): array
{
    $text = '';
    $code = 0;
    while (!feof($socket)) {
        $line = fgets($socket, 1024);
        if ($line === false) {
            break;
        }
        $text .= $line;
        $code = (int) substr($line, 0, 3);
        if (strlen($line) < 4 || $line[3] === ' ') {
            break;
        }
    }

    return [$code, trim($text)];
}

/**
 * Sends a command and insists the reply code is one of $expected.
 * `$label` keeps credentials out of error messages (never echo what was sent).
 */
function smtpCommand($socket, string $command, array $expected, string $label = ''): string
{
    if ($command !== '') {
        fwrite($socket, $command . "\r\n");
    }
    [$code, $text] = smtpRead($socket);
    if (!in_array($code, $expected, true)) {
        $shown = $label !== '' ? $label : substr($command, 0, 40);
        throw new RuntimeException('SMTP rejected "' . $shown . '": ' . $text);
    }

    return $text;
}

/** RFC 5321 dot-stuffing for the DATA payload. */
function dotStuff(string $payload): string
{
    return preg_replace('/^\./m', '..', $payload) ?? $payload;
}

function smtpSend(array $recipients, string $message): void
{
    $context = stream_context_create([
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true],
    ]);

    $socket = @stream_socket_client(
        'ssl://' . SMTP_HOST . ':' . SMTP_PORT,
        $errno,
        $errstr,
        25,
        STREAM_CLIENT_CONNECT,
        $context,
    );
    if ($socket === false) {
        throw new RuntimeException('Cannot reach ' . SMTP_HOST . ': ' . ($errstr ?: $errno));
    }
    stream_set_timeout($socket, 30);

    try {
        smtpRead($socket);                                   // 220 greeting
        smtpCommand($socket, 'EHLO imcbs.com', [250]);
        smtpCommand($socket, 'AUTH LOGIN', [334], 'AUTH LOGIN');
        smtpCommand($socket, base64_encode(SMTP_USER), [334], 'username');
        smtpCommand($socket, base64_encode(SMTP_PASS), [235], 'mailbox password');
        smtpCommand($socket, 'MAIL FROM:<' . MAIL_FROM . '>', [250]);
        foreach ($recipients as $recipient) {
            smtpCommand($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
        }
        smtpCommand($socket, 'DATA', [354]);
        fwrite($socket, dotStuff($message) . "\r\n.\r\n");
        [$code, $text] = smtpRead($socket);
        if ($code !== 250) {
            throw new RuntimeException('SMTP rejected the message: ' . $text);
        }
        smtpCommand($socket, 'QUIT', [221]);
    } finally {
        if (is_resource($socket)) {
            fclose($socket);
        }
    }
}

try {
    smtpSend($recipients, $message);
} catch (RuntimeException $error) {
    respond(502, ['ok' => false, 'error' => $error->getMessage()]);
}

respond(200, [
    'ok' => true,
    'messageId' => $messageId,
    'accepted' => $recipients,
    'from' => MAIL_FROM,
]);
