from ultralytics import YOLO
from tkinter import Tk, filedialog
import os

# Load the YOLOv8x model
model = YOLO("yolo_fruits_and_vegetables_v8x.pt")

# Function to upload an image
def upload_image():
    Tk().withdraw()  # Hide the root window
    file_path = filedialog.askopenfilename(filetypes=[("Image files", "*.jpg *.jpeg *.png")])
    return file_path

# Function to make predictions and extract ingredients
def predict_image(image_path):
    if not os.path.exists(image_path):
        print(f"Error: The file '{image_path}' does not exist.")
        return

    # Make predictions
    results = model.predict(source=image_path, show=True, save=True)

    # Extract detected ingredients and their counts
    detections = results[0].boxes.data.cpu().numpy()  # Extract bounding box data
    ingredient_counts = {}

    for det in detections:
        label_index = int(det[5])  # Class index
        label_name = model.names[label_index]  # Get class name
        if label_name in ingredient_counts:
            ingredient_counts[label_name] += 1
        else:
            ingredient_counts[label_name] = 1

    print("Detected Ingredients and Counts:")
    for ingredient, count in ingredient_counts.items():
        print(f"{ingredient}: {count}")

if __name__ == "__main__":
    print("Upload an image for prediction")
    image_path = upload_image()

    if image_path and os.path.exists(image_path):
        print(f"Image selected: {image_path}")
        predict_image(image_path)
    else:
        print("No image selected or the file does not exist.")
