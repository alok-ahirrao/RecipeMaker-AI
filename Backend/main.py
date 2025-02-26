from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from werkzeug.utils import secure_filename
import os
import uuid
import requests
import logging
from pydantic import BaseModel
from typing import List, Dict
import os
from dotenv import load_dotenv
# Initialize FastAPI app
app = FastAPI()
load_dotenv()
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8x model for ingredient detection
model = YOLO("yolo_fruits_and_vegetables_v8x.pt")

# Create uploads folder if not exists
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Store ingredients and dish state
app.state.ingredients = []
app.state.current_dish = ""

# ✅ Use environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")  # Default model if not set
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# ✅ Set up logging
logging.basicConfig(level=logging.INFO)

# ✅ Define Pydantic Models
class RecipeRequest(BaseModel):
    ingredients: List[str]

class ChatbotQuery(BaseModel):
    query: str

# ✅ Function to call Groq API
def query_groq(prompt):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,  # ✅ Use the correct model from your available list
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers)
        response_json = response.json()

        # ✅ Log response for debugging
        logging.info(f"Groq API Response Status: {response.status_code}")
        logging.info(f"Groq API Response Body: {response_json}")

        if response.status_code == 200 and "choices" in response_json:
            return response_json["choices"][0]["message"]["content"]
        else:
            return f"Error: Unexpected response format: {response_json}"

    except Exception as e:
        return f"Error calling Groq API: {str(e)}"

# ✅ Function to detect ingredients from an uploaded image
def predict_image(image_path) -> Dict[str, int]:
    if not os.path.exists(image_path):
        raise HTTPException(status_code=400, detail=f"File '{image_path}' not found.")

    # YOLOv8 prediction
    results = model.predict(source=image_path, show=False, save=True)

    # Extract detected ingredients
    detections = results[0].boxes.data.cpu().numpy()
    ingredient_counts = {}

    for det in detections:
        label_index = int(det[5])  # Class index
        label_name = model.names[label_index]  # Get class name
        ingredient_counts[label_name] = ingredient_counts.get(label_name, 0) + 1

    return ingredient_counts

# ✅ API to upload image & detect ingredients
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")

    filename = secure_filename(file.filename)
    file_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, file_id + "_" + filename)

    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    # Detect ingredients
    ingredients = predict_image(filepath)

    # Store detected ingredients
    app.state.ingredients = list(ingredients.keys())

    return {"file_id": file_id, "ingredients": ingredients}

# ✅ API to generate a recipe based on detected ingredients
@app.post("/recipe")
async def generate_recipe(request: RecipeRequest):
    ingredients = request.ingredients
    if not ingredients:
        raise HTTPException(status_code=400, detail="No ingredients provided")

    try:
        # Update dish state
        app.state.current_dish = f"Recipe for ingredients: {', '.join(ingredients)}"

        prompt = (
            "You are a world-renowned chef. Based on the given ingredients, "
            "suggest a creative and delicious recipe that enhances their flavors.\n\n"
            f"Ingredients: {', '.join(ingredients)}\n\nRecipe:"
        )
        result = query_groq(prompt)

        if "Error:" in result:
            raise HTTPException(status_code=500, detail=f"Failed to generate recipe: {result}")

        # Format response
        return {
            "title": f"Recipe for Ingredients: {', '.join(ingredients)}",
            "subsections": [
                {"heading": "Ingredients", "items": ingredients},
                {"heading": "Instructions", "steps": [line.strip() for line in result.strip().split('\n') if line.strip()]},
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recipe: {str(e)}")

# ✅ API to handle chatbot queries
@app.post("/chatbot")
async def chatbot_response(query: ChatbotQuery):
    user_query = query.query
    if not user_query:
        raise HTTPException(status_code=400, detail="Query not provided")

    try:
        # Add context from detected ingredients & current dish
        context = "You are a knowledgeable culinary assistant. "
        if app.state.ingredients:
            context += f"Detected ingredients: {', '.join(app.state.ingredients)}. "
        if app.state.current_dish:
            context += f"Current dish: {app.state.current_dish}. "
        else:
            context += "No specific dish is being prepared. "

        # Generate response using Groq API
        prompt = f"{context}\n\nUser Query: {user_query}\n\nResponse:"
        result = query_groq(prompt)

        if "Error:" in result:
            raise HTTPException(status_code=500, detail=f"Failed to generate response: {result}")

        # Format response
        return {
            "title": "Chatbot Response",
            "suggestion": user_query,
            "details": [line.strip() for line in result.strip().split('\n') if line.strip()],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# ✅ Run FastAPI App
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)