#!/usr/bin/env python3
"""
Check and sync official release bundles from NSRingo upstream repositories.

- Queries GitHub Releases REST API (`/repos/NSRingo/<Repo>/releases/latest`).
- Downloads `.bundle.js` assets via the GitHub API asset endpoint (`Accept: application/octet-stream`)
  to avoid `github.com/.../releases/download/...` web gateway 504 timeouts.
- Validates every downloaded JavaScript bundle with `node --check` before writing.
- Updates `scripts/iringo/versions.json` and the upstream version tag in `modules/iRingo-*.sgmodule`.
"""

import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
IRINGO_DIR = ROOT / "scripts" / "iringo"
VERSIONS_PATH = IRINGO_DIR / "versions.json"

TARGETS = [
    {
        "key": "WeatherKit",
        "repo": "NSRingo/WeatherKit",
        "module": ROOT / "modules" / "iRingo-WeatherKit-US.sgmodule",
        "assets": {
            "request.bundle.js": "WeatherKit-request.bundle.js",
            "response.bundle.js": "WeatherKit-response.bundle.js",
        },
    },
    {
        "key": "Siri",
        "repo": "NSRingo/Siri",
        "module": ROOT / "modules" / "iRingo-Siri-Spotlight.sgmodule",
        "assets": {
            "request.bundle.js": "Siri-request.bundle.js",
            "response.bundle.js": "Siri-response.bundle.js",
        },
    },
    {
        "key": "TestFlight",
        "repo": "NSRingo/TestFlight",
        "module": ROOT / "modules" / "iRingo-TestFlight.sgmodule",
        "assets": {
            "request.bundle.js": "TestFlight-request.bundle.js",
            "response.bundle.js": "TestFlight-response.bundle.js",
        },
    },
]

TAG_RE = re.compile(r"^v\d+\.\d+\.\d+$")


def github_headers(accept: str = "application/vnd.github+json") -> dict:
    headers = {
        "Accept": accept,
        "User-Agent": "surge-modules-iringo-sync/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_json(url: str) -> dict:
    proc = subprocess.run(
        [
            "curl",
            "-fsSL",
            "--retry",
            "4",
            "--retry-all-errors",
            "--retry-delay",
            "2",
            "-H",
            "Accept: application/vnd.github+json",
            "-H",
            "User-Agent: surge-modules-iringo-sync/1.0",
            "-H",
            "X-GitHub-Api-Version: 2022-11-28",
            *(
                ["-H", f"Authorization: Bearer {os.environ['GITHUB_TOKEN'].strip()}"]
                if os.environ.get("GITHUB_TOKEN", "").strip()
                else []
            ),
            url,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


def download_asset(asset_api_url: str) -> bytes:
    proc = subprocess.run(
        [
            "curl",
            "-fsSL",
            "--retry",
            "4",
            "--retry-all-errors",
            "--retry-delay",
            "2",
            "-H",
            "Accept: application/octet-stream",
            "-H",
            "User-Agent: surge-modules-iringo-sync/1.0",
            "-H",
            "X-GitHub-Api-Version: 2022-11-28",
            *(
                ["-H", f"Authorization: Bearer {os.environ['GITHUB_TOKEN'].strip()}"]
                if os.environ.get("GITHUB_TOKEN", "").strip()
                else []
            ),
            asset_api_url,
        ],
        capture_output=True,
        check=True,
    )
    return proc.stdout


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_js_syntax(js_bytes: bytes, label: str) -> None:
    with tempfile.NamedTemporaryFile(suffix=".js", delete=False) as tmp:
        tmp.write(js_bytes)
        tmp_path = tmp.name
    try:
        proc = subprocess.run(
            ["node", "--check", tmp_path],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(
                f"node --check failed for {label}:\n{proc.stderr.strip()}"
            )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def load_versions() -> dict:
    if not VERSIONS_PATH.exists():
        return {}
    try:
        return json.loads(VERSIONS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def update_module_tag(module_path: pathlib.Path, old_tag: str, new_tag: str) -> None:
    if not old_tag or old_tag == new_tag:
        return
    text = module_path.read_text(encoding="utf-8")
    updated = text.replace(old_tag, new_tag)
    if updated != text:
        module_path.write_text(updated, encoding="utf-8")


def sync_target(target: dict, versions: dict, force: bool, check_only: bool) -> bool:
    key = target["key"]
    repo = target["repo"]
    release = fetch_json(f"https://api.github.com/repos/{repo}/releases/latest")

    if release.get("draft") or release.get("prerelease"):
        print(f"[SKIP] {repo}: latest release is draft/prerelease")
        return False

    tag_name = release.get("tag_name", "")
    if not TAG_RE.match(tag_name):
        raise RuntimeError(f"{repo}: unexpected tag_name {tag_name!r}")

    current_entry = versions.get(key, {})
    current_tag = current_entry.get("tag_name", "")

    all_files_valid = True
    for upstream_name, local_name in target["assets"].items():
        local_path = IRINGO_DIR / local_name
        expected_sha = current_entry.get("assets", {}).get(local_name, {}).get("sha256")
        if not local_path.exists() or not expected_sha:
            all_files_valid = False
            break
        actual_sha = sha256_hex(local_path.read_bytes())
        if actual_sha != expected_sha:
            all_files_valid = False
            break

    if not force and current_tag == tag_name and all_files_valid:
        print(f"[OK] {repo} is up to date ({tag_name})")
        return False

    if check_only:
        print(f"[UPDATE AVAILABLE] {repo}: {current_tag or 'none'} -> {tag_name}")
        return True

    print(f"[SYNC] {repo}: {current_tag or 'initial'} -> {tag_name}")
    assets_by_name = {a["name"]: a for a in release.get("assets", [])}
    downloaded = {}

    for upstream_name, local_name in target["assets"].items():
        asset_info = assets_by_name.get(upstream_name)
        if not asset_info:
            raise RuntimeError(
                f"{repo} {tag_name}: missing expected release asset {upstream_name}"
            )
        raw_bytes = download_asset(asset_info["url"])
        verify_js_syntax(raw_bytes, f"{repo}@{tag_name}:{upstream_name}")
        downloaded[local_name] = {
            "bytes": raw_bytes,
            "sha256": sha256_hex(raw_bytes),
            "size": len(raw_bytes),
            "upstream_name": upstream_name,
        }

    IRINGO_DIR.mkdir(parents=True, exist_ok=True)
    for local_name, info in downloaded.items():
        (IRINGO_DIR / local_name).write_bytes(info["bytes"])

    if current_tag and current_tag != tag_name:
        update_module_tag(target["module"], current_tag, tag_name)

    versions[key] = {
        "repo": repo,
        "tag_name": tag_name,
        "published_at": release.get("published_at", ""),
        "html_url": release.get("html_url", ""),
        "assets": {
            local_name: {
                "upstream_name": info["upstream_name"],
                "size": info["size"],
                "sha256": info["sha256"],
            }
            for local_name, info in downloaded.items()
        },
    }
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync NSRingo upstream release bundles.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download and re-verify even if tag_name matches versions.json.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only check whether updates are available without writing files.",
    )
    args = parser.parse_args()

    versions = load_versions()
    changed = False
    for target in TARGETS:
        if sync_target(target, versions, force=args.force, check_only=args.check):
            changed = True
            if not args.check:
                VERSIONS_PATH.write_text(
                    json.dumps(versions, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8",
                )

    if changed and not args.check:
        print(f"Updated {VERSIONS_PATH.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
