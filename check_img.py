import base64
from PIL import Image
import io

img = Image.open(r'C:\Users\ILMI\Pictures\Untitled.jpg')
print(f"Size: {img.size}, Mode: {img.mode}")

# Save a small thumbnail to check
img.thumbnail((200, 200))
img.save(r'D:\PROGRAMING\KONTER\thumb_check.png')
print("Thumbnail saved.")