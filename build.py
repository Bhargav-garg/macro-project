#!/usr/bin/env python3
"""
Build & Compiler Script for Deep Pawn Chess Bot.
Compiles and packages the project into the 'dist/' folder:
1. dist/index.html: Standalone single-file build with inlined CSS, SVGs, audio, and JS.
2. dist/web/: Modular production web distribution (HTML + bundled JS + CSS).
3. dist/cli_chess.pyz: Standalone compiled Python executable ZipApp for CLI chess.
4. dist/chess_web.pyz: Standalone compiled Python executable ZipApp for web server launcher.
5. dist/Play-Web.bat: One-click Windows batch launcher for the web application.
6. dist/Play-CLI.bat: One-click Windows batch launcher for the CLI application.
7. dist/chess-bot-compiled.zip: Portable distribution zip file.
"""

import os
import shutil
import zipfile
import py_compile
import zipapp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')


def clean_dist():
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(DIST_DIR, exist_ok=True)
    print(f"[*] Cleaned and created dist directory: {DIST_DIR}")


def build_single_file_html():
    """Bundles index.html, style.css, chess-engine.js, pieces.js, audio.js, app.js into a single standalone HTML file."""
    print("[*] Compiling standalone single-file index.html...")

    with open(os.path.join(BASE_DIR, 'style.css'), 'r', encoding='utf-8') as f:
        css_content = f.read()

    with open(os.path.join(BASE_DIR, 'chess-engine.js'), 'r', encoding='utf-8') as f:
        engine_js = f.read()

    with open(os.path.join(BASE_DIR, 'pieces.js'), 'r', encoding='utf-8') as f:
        pieces_js = f.read()

    with open(os.path.join(BASE_DIR, 'audio.js'), 'r', encoding='utf-8') as f:
        audio_js = f.read()

    with open(os.path.join(BASE_DIR, 'app.js'), 'r', encoding='utf-8') as f:
        app_js = f.read()

    with open(os.path.join(BASE_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace external css link with inlined style
    html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css_content}\n</style>')

    # Replace external scripts with bundled script
    scripts_to_remove = [
        '<script src="chess-engine.js"></script>',
        '<script src="pieces.js"></script>',
        '<script src="audio.js"></script>',
        '<script src="app.js"></script>'
    ]
    for s in scripts_to_remove:
        html = html.replace(s, '')

    bundled_js = f"""<script>
/* --- CHESS ENGINE --- */
{engine_js}

/* --- SVG PIECES --- */
{pieces_js}

/* --- PROCEDURAL AUDIO --- */
{audio_js}

/* --- UI CONTROLLER --- */
{app_js}
</script>"""

    html = html.replace('</body>', f'{bundled_js}\n</body>')

    output_path = os.path.join(DIST_DIR, 'index.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"    [+] Created: {output_path} ({os.path.getsize(output_path):,} bytes)")


def build_modular_web():
    """Builds a modular web folder with bundled JS."""
    print("[*] Compiling modular web package...")
    web_dir = os.path.join(DIST_DIR, 'web')
    os.makedirs(web_dir, exist_ok=True)

    # Copy and bundle js
    with open(os.path.join(BASE_DIR, 'chess-engine.js'), 'r', encoding='utf-8') as f:
        engine_js = f.read()
    with open(os.path.join(BASE_DIR, 'pieces.js'), 'r', encoding='utf-8') as f:
        pieces_js = f.read()
    with open(os.path.join(BASE_DIR, 'audio.js'), 'r', encoding='utf-8') as f:
        audio_js = f.read()
    with open(os.path.join(BASE_DIR, 'app.js'), 'r', encoding='utf-8') as f:
        app_js = f.read()

    bundle_js_path = os.path.join(web_dir, 'chess.bundle.js')
    with open(bundle_js_path, 'w', encoding='utf-8') as f:
        f.write(f"{engine_js}\n\n{pieces_js}\n\n{audio_js}\n\n{app_js}\n")

    # Copy style.css
    shutil.copy2(os.path.join(BASE_DIR, 'style.css'), os.path.join(web_dir, 'style.css'))

    # Modified index.html pointing to bundle.js
    with open(os.path.join(BASE_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()
    for s in ['<script src="chess-engine.js"></script>', '<script src="pieces.js"></script>', '<script src="audio.js"></script>']:
        html = html.replace(s + '\n  ', '')
        html = html.replace(s, '')
    html = html.replace('<script src="app.js"></script>', '<script src="chess.bundle.js"></script>')

    with open(os.path.join(web_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"    [+] Created modular package at: {web_dir}")


def build_python_zipapps():
    """Compiles Python CLI and launcher into standalone ZipApps (.pyz)."""
    print("[*] Compiling Python ZipApp executables...")

    # 1. CLI ZipApp
    cli_build_dir = os.path.join(DIST_DIR, '_cli_tmp')
    os.makedirs(cli_build_dir, exist_ok=True)
    shutil.copy2(os.path.join(BASE_DIR, 'cli_chess.py'), os.path.join(cli_build_dir, '__main__.py'))
    cli_pyz_path = os.path.join(DIST_DIR, 'cli_chess.pyz')
    zipapp.create_archive(cli_build_dir, cli_pyz_path, compressed=True)
    shutil.rmtree(cli_build_dir)
    print(f"    [+] Created Python ZipApp: {cli_pyz_path} ({os.path.getsize(cli_pyz_path):,} bytes)")

    # 2. Web Launcher ZipApp
    web_build_dir = os.path.join(DIST_DIR, '_web_tmp')
    os.makedirs(web_build_dir, exist_ok=True)
    shutil.copy2(os.path.join(BASE_DIR, 'app.py'), os.path.join(web_build_dir, '__main__.py'))
    # Also include the web files in launcher zipapp
    shutil.copy2(os.path.join(DIST_DIR, 'index.html'), os.path.join(web_build_dir, 'index.html'))
    launcher_pyz_path = os.path.join(DIST_DIR, 'chess_web.pyz')
    zipapp.create_archive(web_build_dir, launcher_pyz_path, compressed=True)
    shutil.rmtree(web_build_dir)
    print(f"    [+] Created Python ZipApp: {launcher_pyz_path} ({os.path.getsize(launcher_pyz_path):,} bytes)")


def build_bytecode_cache():
    """Compiles Python scripts to .pyc bytecode."""
    print("[*] Compiling Python source files to bytecode (.pyc)...")
    pyc_dir = os.path.join(DIST_DIR, 'pyc')
    os.makedirs(pyc_dir, exist_ok=True)

    py_compile.compile(
        os.path.join(BASE_DIR, 'cli_chess.py'),
        cfile=os.path.join(pyc_dir, 'cli_chess.pyc'),
        optimize=2
    )
    py_compile.compile(
        os.path.join(BASE_DIR, 'app.py'),
        cfile=os.path.join(pyc_dir, 'app.pyc'),
        optimize=2
    )
    print(f"    [+] Created compiled bytecode in: {pyc_dir}")


def build_batch_launchers():
    """Creates one-click Windows .bat launchers."""
    print("[*] Creating Windows one-click batch launchers...")

    # Play-Web.bat
    web_bat = """@echo off
title Deep Pawn Chess Bot - Web Edition
echo Starting Deep Pawn Chess Web Server...
python -m http.server 8000 --directory "%~dp0" > nul 2>&1 &
start "" "http://localhost:8000/index.html"
exit
"""
    with open(os.path.join(DIST_DIR, 'Play-Web.bat'), 'w', encoding='utf-8') as f:
        f.write(web_bat)

    # Play-CLI.bat
    cli_bat = """@echo off
title Deep Pawn Chess Bot - CLI Edition
cls
python "%~dp0cli_chess.pyz"
if %errorlevel% neq 0 (
    echo.
    echo Running python failed. Trying direct python command...
    python -c "import urllib" 2>nul || (
        echo Python 3 is required to run CLI Chess.
        pause
    )
)
pause
"""
    with open(os.path.join(DIST_DIR, 'Play-CLI.bat'), 'w', encoding='utf-8') as f:
        f.write(cli_bat)

    print("    [+] Created Play-Web.bat and Play-CLI.bat")


def build_distribution_zip():
    """Packs the dist folder into a portable zip archive."""
    print("[*] Packaging final distribution zip...")
    zip_path = os.path.join(DIST_DIR, 'chess-bot-standalone.zip')

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(DIST_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                if file.endswith('.zip'):
                    continue
                arcname = os.path.relpath(file_path, DIST_DIR)
                zipf.write(file_path, arcname)

    print(f"    [+] Created portable zip: {zip_path} ({os.path.getsize(zip_path):,} bytes)")


def main():
    print("=" * 60)
    print("      COMPILING DEEP PAWN CHESS BOT PROJECT")
    print("=" * 60)
    clean_dist()
    build_single_file_html()
    build_modular_web()
    build_python_zipapps()
    build_bytecode_cache()
    build_batch_launchers()
    build_distribution_zip()
    print("=" * 60)
    print(" COMPILATION COMPLETE! All output files are in:")
    print(f" {DIST_DIR}")
    print("=" * 60)


if __name__ == '__main__':
    main()
