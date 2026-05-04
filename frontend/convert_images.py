import os
from PIL import Image

assets_dir = r"c:\Users\Sasiri Theekshana\Desktop\Atelier-main\frontend\src\assets"

files = ["adaptive-icon.png", "icon.png", "splash.png", "favicon.png", "login-bg.png", "splash-fabric.png", "home-hero.png", "prod-bag.png", "prod-sneaker.png", "prod-yellow.png", "cat-dresses.png"]

for filename in files:
    filepath = os.path.join(assets_dir, filename)
    if os.path.exists(filepath):
        try:
            with Image.open(filepath) as img:
                print(f"Processing {filename}... Format: {img.format}")
                # Convert to RGBA if needed
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # Save as PNG
                img.save(filepath, format="PNG")
                print(f"Successfully converted {filename} to PNG.")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")
