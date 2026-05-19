"""
Deployment Package Script — PhishGuard

Creates a clean deployment ZIP containing:
  1. backend/ — All Python files + requirements (no cache/tests/db)
  2. frontend-dist/ — Built React static files
  3. deploy/ — .htaccess + .env.production template
  4. extension/ — Chrome extension files

Usage:
    python deploy/package.py
"""

import shutil
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).parent.parent
DIST_DIR = PROJECT_ROOT / "deployment_package"

# Files/dirs to EXCLUDE from the backend upload
BACKEND_EXCLUDE = {
    "__pycache__", ".pytest_cache", "tests", ".env",
    "phishing_platform.db", ".env.example",
}


def clean():
    """Remove old deployment package."""
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)


def package_backend():
    """Copy backend files, excluding dev artifacts."""
    src = PROJECT_ROOT / "backend"
    dst = DIST_DIR / "backend"

    def ignore(directory, files):
        return [f for f in files if f in BACKEND_EXCLUDE]

    shutil.copytree(src, dst, ignore=ignore)
    print(f"  ✅ Backend packaged → {dst}")


def package_frontend():
    """Copy built frontend dist."""
    src = PROJECT_ROOT / "frontend" / "dist"
    dst = DIST_DIR / "public_html"

    if not src.exists():
        print("  ❌ frontend/dist/ not found! Run 'npm run build' in frontend/ first.")
        return False

    shutil.copytree(src, dst)

    # Copy .htaccess into public_html
    htaccess_src = PROJECT_ROOT / "deploy" / ".htaccess"
    if htaccess_src.exists():
        shutil.copy2(htaccess_src, dst / ".htaccess")

    print(f"  ✅ Frontend packaged → {dst}")
    return True


def package_extension():
    """Copy Chrome extension files."""
    src = PROJECT_ROOT / "extension"
    dst = DIST_DIR / "extension"
    shutil.copytree(src, dst)
    print(f"  ✅ Extension packaged → {dst}")


def package_deploy_configs():
    """Copy deployment config templates."""
    src = PROJECT_ROOT / "deploy"
    dst = DIST_DIR / "deploy-configs"
    dst.mkdir(parents=True, exist_ok=True)

    for f in src.iterdir():
        if f.is_file():
            shutil.copy2(f, dst / f.name)

    print(f"  ✅ Deploy configs packaged → {dst}")


def create_zip():
    """Create a ZIP archive of the deployment package."""
    zip_path = PROJECT_ROOT / "phishguard-deploy"
    shutil.make_archive(str(zip_path), "zip", str(DIST_DIR))
    print(f"\n📦 Deployment ZIP created: {zip_path}.zip")
    return f"{zip_path}.zip"


def main():
    print("=" * 50)
    print("  PhishGuard — Deployment Packager")
    print("=" * 50)
    print()

    print("1. Cleaning old package...")
    clean()

    print("2. Packaging backend...")
    package_backend()

    print("3. Packaging frontend build...")
    if not package_frontend():
        return

    print("4. Packaging extension...")
    package_extension()

    print("5. Packaging deploy configs...")
    package_deploy_configs()

    print("6. Creating ZIP archive...")
    zip_path = create_zip()

    print()
    print("=" * 50)
    print("  DEPLOYMENT PACKAGE READY!")
    print("=" * 50)
    print()
    print("Upload instructions:")
    print(f"  1. Upload backend/ contents → ~/phishguard/ on server")
    print(f"  2. Upload public_html/ contents → ~/public_html/ on server")
    print(f"  3. Copy deploy-configs/.env.production → ~/phishguard/.env")
    print(f"  4. Edit .env and replace 'yourdomain.com' with your domain")
    print(f"  5. Update extension/background.js API_BASE with your domain")
    print()


if __name__ == "__main__":
    main()
