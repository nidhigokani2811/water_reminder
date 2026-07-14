import sys
from PIL import Image

tolerance = 30

for i in range(1, 7):
    try:
        filename = f'character{i}.png'
        img = Image.open(filename)
        img = img.convert('RGBA')
        datas = img.getdata()
        new_data = []

        for item in datas:
            # If the pixel is close to white, make it transparent
            if abs(item[0] - 255) < tolerance and abs(item[1] - 255) < tolerance and abs(item[2] - 255) < tolerance:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(filename, 'PNG')
        print(f"Processed {filename} successfully!")
    except Exception as e:
        print(f"Failed {filename}: {e}")
