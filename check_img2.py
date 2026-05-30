from PIL import Image
import base64

img = Image.open(r'C:\Users\ILMI\Pictures\Untitled.jpg')
print(f"Size: {img.size}, Mode: {img.mode}")

# Save as PNG which Read tool may handle better
img.save(r'D:\PROGRAMING\KONTER\img_check.png', 'PNG')

# Get image as base64 to check
with open(r'D:\PROGRAMING\KONTER\img_check.png', 'rb') as f:
    data = f.read()
print(f"PNG size: {len(data)} bytes")
print(f"PNG header: {data[:8]}")