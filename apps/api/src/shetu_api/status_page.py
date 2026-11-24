"""Branded HTML pages for people who open the API in a browser.

Machines (load balancers, monitors, scripts) keep getting JSON from the same URLs; these pages
are served only when the request asks for HTML.
"""

import urllib.parse
from html import escape

from shetu_api.health import Check

PROVIDER_LABEL = {
    "groq": "Groq",
    "gemini": "Google Gemini",
    "anthropic": "Anthropic Claude",
    "local": "Local model (on-premise)",
    "replay": "Replay (recorded replies)",
}

ICON_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<rect width="64" height="64" rx="14" fill="#BF092F"/><g transform="translate(0 -4)">'
    '<path d="M24 31.5V40M32 29V40M40 31.5V40" stroke="#E58C9D" stroke-width="2.6"/>'
    '<path d="M13 40 Q32 10 51 40" fill="none" stroke="#FFFFFF" stroke-width="5.5" '
    'stroke-linecap="round"/>'
    '<path d="M9 42.5H49" stroke="#F9DFE4" stroke-width="5" stroke-linecap="round"/>'
    '<circle cx="52" cy="42.5" r="4.6" fill="#FFFFFF"/></g></svg>'
)
FAVICON = "data:image/svg+xml," + urllib.parse.quote(ICON_SVG)

CSS = """
:root{color-scheme:light;--paper:#F8F4EC;--card:#fff;--line:#E7DFD2;--ink:#222023;
--muted:#6F676A;--crimson:#BF092F;--crimson-ink:#A10727;--blush:#FBE6EA;--leaf:#1F7A48;--leaf-soft:#E1F3E7}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
font:14px/1.6 "Plus Jakarta Sans","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
header{border-bottom:1px solid var(--line)}
.bar{max-width:880px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:12px}
.bar img{width:28px;height:28px}
.bar b{font-size:15px}
.bar .bn{font-family:"Hind Siliguri",sans-serif;color:var(--crimson);font-weight:600}
.bar nav{margin-left:auto;display:flex;gap:4px}
.bar nav a{padding:6px 10px;border-radius:8px;text-decoration:none;color:var(--muted);font-weight:500}
.bar nav a:hover,.bar nav a[aria-current]{background:#F1E9DC;color:var(--ink)}
main{max-width:880px;margin:0 auto;padding:32px 24px 40px}
h1{margin:0;font-size:26px;letter-spacing:-.02em;font-weight:700}
.sub{margin:4px 0 0;color:var(--muted)}
.banner{margin:24px 0;display:flex;align-items:center;gap:14px;padding:16px 20px;border-radius:14px;
background:var(--leaf-soft);color:var(--leaf);font-weight:600;border:1px solid rgba(31,122,72,.18)}
.banner.bad{background:var(--blush);color:var(--crimson-ink);border-color:rgba(191,9,47,.2)}
.pulse{width:10px;height:10px;border-radius:50%;background:currentColor;animation:p 2s infinite}
@keyframes p{0%{box-shadow:0 0 0 0 rgba(31,122,72,.45)}70%{box-shadow:0 0 0 10px rgba(31,122,72,0)}
100%{box-shadow:0 0 0 0 rgba(31,122,72,0)}}
@media (prefers-reduced-motion:reduce){.pulse{animation:none}}
.banner small{margin-left:auto;font-weight:500;opacity:.8}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(34,32,35,.04);
min-width:0}
.card h2{margin:0;padding:14px 18px;border-bottom:1px solid var(--line);font-size:13px;font-weight:600}
.rows div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 18px;
border-top:1px solid var(--line)}
.rows div:first-child{border-top:0}
.rows span.k{color:var(--muted)}
.rows b{font-weight:600;text-align:right}
.chip{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600}
.chip.ok{background:var(--leaf-soft);color:var(--leaf)}
.chip.bad{background:var(--blush);color:var(--crimson-ink)}
.chip i{width:6px;height:6px;border-radius:50%;background:currentColor}
.ms{color:var(--muted);font-weight:500;font-size:12px;margin-right:8px}
.links{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-top:16px}
.links a{display:block;padding:14px 16px;border-radius:12px;border:1px solid var(--line);background:var(--card);
text-decoration:none;transition:border-color .15s,transform .15s}
.links a:hover{border-color:var(--crimson);transform:translateY(-1px)}
.links a b{display:block;font-size:14px}
.links a span{color:var(--muted);font-size:12.5px}
.links a.primary{background:var(--crimson);border-color:var(--crimson);color:#fff}
.links a.primary span{color:#FBE6EA}
code{font-family:"JetBrains Mono",ui-monospace,Consolas,monospace;font-size:12.5px;background:#F3EDE2;
padding:2px 6px;border-radius:6px}
pre{margin:0;padding:14px 18px;font:12.5px/1.65 "JetBrains Mono",ui-monospace,Consolas,monospace;overflow-x:auto}
footer{max-width:880px;margin:0 auto;padding:0 24px 32px;color:var(--muted);font-size:12px}
"""


def _shell(title: str, active: str, body: str) -> str:
    nav = "".join(
        f'<a href="{href}"{" aria-current=page" if key == active else ""}>{label}</a>'
        for key, href, label in (
            ("status", "/", "Status"),
            ("health", "/healthz", "Health"),
            ("docs", "/docs", "API reference"),
        )
    )
    fonts = (
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700"
        "&family=Hind+Siliguri:wght@600&family=JetBrains+Mono&display=swap"
    )
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} · Shetu API</title>
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{fonts}" rel="stylesheet">
<style>{CSS}</style></head><body>
<header><div class="bar"><img src="{FAVICON}" alt="">
<b>Shetu API <span class="bn">সেতু</span></b><nav>{nav}</nav></div></header>
<main>{body}</main>
<footer>Team_Anomaly · International AI Builders Congress 2026 · All demo data is synthetic.</footer>
</body></html>"""


def _uptime(seconds: int) -> str:
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}h {m}m" if h else f"{m}m {s}s"


def _banner(checks: list[Check], uptime: int) -> str:
    ok = all(c.ok for c in checks)
    text = "All systems operational" if ok else "Degraded: some checks are failing"
    return (
        f'<div class="banner{"" if ok else " bad"}"><span class="pulse"></span>{text}'
        f"<small>Up {_uptime(uptime)}</small></div>"
    )


def _checks_card(checks: list[Check]) -> str:
    rows = "".join(
        f'<div><span class="k">{escape(c.name)}</span><b>'
        + (f'<span class="ms">{c.latency_ms:g} ms</span>' if c.latency_ms is not None else "")
        + f'<span class="chip {"ok" if c.ok else "bad"}"><i></i>'
        + escape(PROVIDER_LABEL.get(c.detail, c.detail))
        + "</span></b></div>"
        for c in checks
    )
    return f'<section class="card"><h2>Checks</h2><div class="rows">{rows}</div></section>'


def render_status(*, version: str, checks: list[Check], uptime: int, app_url: str) -> str:
    service = (
        '<section class="card"><h2>Service</h2><div class="rows">'
        f'<div><span class="k">Version</span><b>{escape(version)}</b></div>'
        '<div><span class="k">Region</span><b>Singapore</b></div>'
        '<div><span class="k">API base</span><b><code>/api/v1</code></b></div>'
        '<div><span class="k">Access</span><b>Role-checked on every request</b></div>'
        "</div></section>"
    )
    body = f"""<h1>Shetu API</h1>
<p class="sub">The service behind Shetu: the AI interview, the Role Map, checked cover plans and the
return guard.</p>
{_banner(checks, uptime)}
<div class="grid">{_checks_card(checks)}{service}</div>
<div class="links">
<a class="primary" href="{escape(app_url)}"><b>Open the Shetu app</b><span>Sign in with a demo account</span></a>
<a href="/docs"><b>API reference</b><span>Every endpoint, with examples</span></a>
<a href="/healthz"><b>Health</b><span>Live checks, also as JSON</span></a>
</div>"""
    return _shell("Status", "status", body)


def render_health(*, payload_json: str, checks: list[Check], uptime: int) -> str:
    body = f"""<h1>Health</h1>
<p class="sub">Live checks run on every request. Monitors and scripts receive the same data as JSON.</p>
{_banner(checks, uptime)}
<div class="grid">{_checks_card(checks)}
<section class="card"><h2>JSON response</h2><pre>{escape(payload_json)}</pre></section></div>
<p class="sub" style="margin-top:16px">Get the JSON with
<code>curl https://shetu-api.onrender.com/healthz</code> or any client that does not ask for HTML.</p>"""
    return _shell("Health", "health", body)


DOCS_CSS = """
.light-mode{--scalar-color-accent:#BF092F;--scalar-background-1:#FFFFFF;--scalar-background-2:#F8F4EC;
--scalar-background-3:#F1E9DC;--scalar-border-color:#E7DFD2;--scalar-color-1:#222023;
--scalar-color-2:#4A4448;--scalar-color-3:#6F676A;
--scalar-font:"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif}
.light-mode .t-doc__sidebar{--scalar-sidebar-background-1:#FBF8F2;
--scalar-sidebar-item-active-background:#F1E9DC;--scalar-sidebar-color-active:#BF092F}
"""
