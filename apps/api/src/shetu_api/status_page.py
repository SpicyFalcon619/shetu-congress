"""A small branded page at the API root, so the service address explains itself."""

from html import escape

PROVIDER_LABEL = {
    "groq": "Groq",
    "gemini": "Google Gemini",
    "anthropic": "Anthropic Claude",
    "local": "Local model (on-premise)",
    "replay": "Replay (recorded replies)",
}

FAVICON = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2064%2064%22%3E%20%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23BF092F%22/%3E%20%3Cg%20transform%3D%22translate%280%20-4%29%22%3E%20%3Cpath%20d%3D%22M24%2031.5V40M32%2029V40M40%2031.5V40%22%20stroke%3D%22%23E58C9D%22%20stroke-width%3D%222.6%22/%3E%20%3Cpath%20d%3D%22M13%2040%20Q32%2010%2051%2040%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%225.5%22%20stroke-linecap%3D%22round%22/%3E%20%3Cpath%20d%3D%22M9%2042.5H49%22%20stroke%3D%22%23F9DFE4%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22/%3E%20%3Ccircle%20cx%3D%2252%22%20cy%3D%2242.5%22%20r%3D%224.6%22%20fill%3D%22%23FFFFFF%22/%3E%20%3C/g%3E%20%3C/svg%3E"

LOGO = (
    '<svg viewBox="0 0 132 52" width="92" aria-hidden="true">'
    '<path d="M44 34V22M58 34V14M72 34V14M86 34V22" stroke="#F2B8C3" stroke-width="3"/>'
    '<path d="M18 36 Q66 -10 116 36" fill="none" stroke="#BF092F" stroke-width="5.5" stroke-linecap="round"/>'
    '<path d="M6 38H118" stroke="#222023" stroke-width="5" stroke-linecap="round"/>'
    '<circle cx="121" cy="38" r="6" fill="#BF092F"/></svg>'
)


def render(*, version: str, provider: str, fallback: str, app_url: str) -> str:
    model = PROVIDER_LABEL.get(provider, provider)
    backup = ", ".join(
        PROVIDER_LABEL.get(p.strip(), p.strip()) for p in fallback.split(",") if p.strip()
    )
    rows = [
        ("Status", '<span class="ok"><i></i>Operational</span>'),
        ("Version", escape(version)),
        ("AI model", escape(model)),
    ]
    if backup:
        rows.append(("Fallback", escape(backup)))
    table = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in rows)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shetu API</title>
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@600&display=swap" rel="stylesheet">
<style>
:root{{color-scheme:light}}
*{{box-sizing:border-box}}
body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#F8F4EC;color:#222023;
font:15px/1.6 "Plus Jakarta Sans","Segoe UI",system-ui,sans-serif;padding:24px}}
main{{width:100%;max-width:520px;background:#fff;border:1px solid #E7DFD2;border-radius:16px;padding:32px;
box-shadow:0 1px 2px rgba(34,32,35,.04),0 12px 32px -20px rgba(34,32,35,.25)}}
h1{{margin:16px 0 4px;font-size:24px;letter-spacing:-.02em}}
h1 span{{font-family:"Hind Siliguri",sans-serif;color:#BF092F;font-weight:600}}
p{{margin:0;color:#6F676A}}
dl{{margin:24px 0;border:1px solid #E7DFD2;border-radius:12px}}
dl div{{display:flex;justify-content:space-between;gap:16px;padding:11px 16px;border-top:1px solid #E7DFD2}}
dl div:first-child{{border-top:0}}
dt{{color:#6F676A}} dd{{margin:0;font-weight:600;text-align:right}}
.ok{{display:inline-flex;align-items:center;gap:8px;color:#1F7A48}}
.ok i{{width:8px;height:8px;border-radius:50%;background:#1F7A48;box-shadow:0 0 0 4px #E1F3E7}}
nav{{display:grid;gap:8px;grid-template-columns:1fr 1fr}}
a{{display:block;text-align:center;padding:10px 14px;border-radius:10px;border:1px solid #D6CBB9;
color:#222023;text-decoration:none;font-weight:600}}
a:hover{{background:#F3EDE2}}
a.primary{{grid-column:1/-1;background:#BF092F;border-color:#BF092F;color:#fff}}
a.primary:hover{{background:#A10727}}
footer{{margin-top:20px;font-size:12px;color:#6F676A;text-align:center}}
</style></head>
<body><main>
{LOGO}
<h1>Shetu API <span>সেতু</span></h1>
<p>The service behind Shetu: interview, Role Map, checked cover plans and the return guard.</p>
<dl>{table}</dl>
<nav>
<a class="primary" href="{escape(app_url)}">Open the Shetu app</a>
<a href="/docs">API documentation</a>
<a href="/healthz">Health check</a>
</nav>
<footer>Team Anomaly · International AI Builders Congress 2026 · Synthetic demo data only</footer>
</main></body></html>"""
