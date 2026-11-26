# Validates netlify.toml against Flood's rules. Run: python3 01-check-netlify-toml.py
import tomllib, pathlib, sys
cfg = tomllib.loads(pathlib.Path(__file__).with_name("netlify.toml").read_text())
errors = []
if cfg["build"]["publish"] != "public": errors.append("publish dir must be public/")
if "environment" in cfg.get("build", {}) or "context" in cfg:
    errors.append("don't declare env vars in netlify.toml (not visible to functions; secrets belong in the UI/CLI)")
if ".claude/agents/**" not in cfg["functions"]["included_files"]: errors.append("bundle .claude/agents for /api/agents")
by_path = {h["for"]: h["values"] for h in cfg["headers"]}
csp = by_path["/*"]["Content-Security-Policy"]
for needed in ["default-src 'self'", "script-src 'self'", "frame-ancestors 'none'", "https://api.open-meteo.com", "https://marine-api.open-meteo.com", "worker-src 'self'"]:
    if needed not in csp: errors.append(f"CSP missing {needed}")
if "unsafe-inline" in csp or "unsafe-eval" in csp: errors.append("CSP must not allow unsafe-inline/eval")
if by_path.get("/sw.js", {}).get("Cache-Control") != "no-cache": errors.append("sw.js must be no-cache")
if "rateLimit" in str(cfg) or "rate_limit" in str(cfg.get("functions", {})):
    errors.append("function rate limits can't be set in netlify.toml; use config.rateLimit in code")
print("\n".join(errors) or "01-check-netlify-toml: all checks passed")
sys.exit(1 if errors else 0)
