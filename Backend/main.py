# Copyright (c) 2025, Alok Ahirrao
# This file is part of the Recipe Chatbot project.
# Licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
# For details, see the LICENSE file or visit http://creativecommons.org/licenses/by-nc/4.0/.

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from langchain_ollama import OllamaLLM
from werkzeug.utils import secure_filename
import os
import uuid
from pydantic import BaseModel
from typing import List, Dict

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLOv8x model
model = YOLO("yolo_fruits_and_vegetables_v8x.pt")

# Instantiate the Ollama LLM model
llama_model = OllamaLLM(model="llama3.2:1b")

# Directory to save uploaded images
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Define custom state for ingredients and dish
app.state.ingredients = []
app.state.current_dish = ""

# Define a Pydantic model for recipe request
class RecipeRequest(BaseModel):
    ingredients: List[str]

# Define a Pydantic model for chatbot query
class ChatbotQuery(BaseModel):
    query: str

# Function to make predictions and extract ingredients
def predict_image(image_path) -> Dict[str, int]:
    if not os.path.exists(image_path):
        raise HTTPException(status_code=400, detail=f"The file '{image_path}' does not exist.")

    # Make predictions
    results = model.predict(source=image_path, show=False, save=True)

    # Extract detected ingredients and their counts
    detections = results[0].boxes.data.cpu().numpy()
    ingredient_counts = {}

    for det in detections:
        label_index = int(det[5])  # Class index
        label_name = model.names[label_index]  # Get class name
        ingredient_counts[label_name] = ingredient_counts.get(label_name, 0) + 1

    return ingredient_counts

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")

    filename = secure_filename(file.filename)
    file_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, file_id + "_" + filename)
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    # Predict ingredients
    ingredients = predict_image(filepath)

    # Store detected ingredients in the state
    app.state.ingredients = list(ingredients.keys())

    return {"file_id": file_id, "ingredients": ingredients}

@app.post("/recipe")
async def generate_recipe(request: RecipeRequest):
    ingredients = request.ingredients
    if not ingredients:
        raise HTTPException(status_code=400, detail="Ingredients not provided")

    try:
        # Update the current dish context
        app.state.current_dish = f"Recipe for ingredients: {', '.join(ingredients)}"

        prompt = (
            "You are a world-renowned chef. Based on the given ingredients, "
            "suggest an excellent recipe that highlights their flavors and can impress anyone.\n\n"
            f"Ingredients: {', '.join(ingredients)}\n\nAnswer:"
        )
        result = llama_model.invoke(input=prompt)

        if not result:
            raise HTTPException(status_code=500, detail="No recipe generated")

        # Format the response for React
        return {
            "title": f"Recipe for Ingredients: {', '.join(ingredients)}",
            "subsections": [
                {"heading": "Ingredients", "items": ingredients},
                {"heading": "Instructions", "steps": [line.strip() for line in result.strip().split('\n') if line.strip()]},
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recipe: {str(e)}")

@app.post("/chatbot")
async def chatbot_response(query: ChatbotQuery):
    user_query = query.query
    if not user_query:
        raise HTTPException(status_code=400, detail="Query not provided")

    try:
        # Include context of detected ingredients and the current dish
        context = "You are an intelligent assistant specializing in culinary arts. "
        if app.state.ingredients:
            context += f"The user has identified the following ingredients: {', '.join(app.state.ingredients)}. "
        if app.state.current_dish:
            context += f"Currently, the dish being prepared is: {app.state.current_dish}. "
        else:
            context += "No specific dish is being prepared. "

        # Generate the prompt for the model
        prompt = (
            f"{context}\n\n"
            f"User Query: {user_query}\n\n"
            "Your Response:"
        )

        # Get the response from the LLM
        result = llama_model.invoke(input=prompt)

        if not result:
            raise HTTPException(status_code=500, detail="No response generated")

        # Format the response for React
        return {
            "title": "Chatbot Response",
            "suggestion": user_query,
            "details": [line.strip() for line in result.strip().split('\n') if line.strip()],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
