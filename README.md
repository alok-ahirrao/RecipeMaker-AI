# Recipe Chatbot

This repository contains a **Recipe Chatbot** that allows users to upload images of ingredients, detect the ingredients, and generate recipes based on them using AI models like YOLO for image detection and Ollama LLM for recipe generation.

---
## Demo

![Recipe Chatbot Demo](Output/Recipe%20Chatbot.gif)

---

## **Project Structure**

```
LLVIS_FRUITS_AND_VEGETABLES
├── Backend
│   ├── Recipe_Chatbot/              # Virtual environment folder
│   ├── uploads/                    # Folder to save uploaded images
│   ├── runs/                       # YOLO runs folder
│   ├── main.py                     # FastAPI server
│   ├── requirements.txt            # Python dependencies
│   ├── yolo_fruits_and_vegetables_v8x.pt # YOLO model weights
├── recipe-maker
│   ├── node_modules/               # React dependencies
│   ├── public/                     # Static assets
│   ├── src/                        # React source code
│   │   ├── App.js                  # Main React component
│   │   ├── App.css                 # Styles
│   │   ├── index.js                # Entry point for React
│   │   ├── chef-avatar.png         # Chatbot avatar
│   │   ├── user-avatar.png         # User avatar
│   │   ├── 2.png, 7.11.png         # Additional assets
│   ├── package.json                # React dependencies
│   ├── package-lock.json           # Lockfile for dependencies
├── README.md                      # Documentation
```

---

## **Backend (FastAPI)**

### Features:

- **Image Upload**: Detects ingredients in images using YOLO.
- **Recipe Generation**: Generates recipes based on detected ingredients using Ollama LLM.
- **Chatbot**: Interactive chatbot to assist users with culinary questions.

### Setup Instructions:

1. Create a virtual environment:
   ```bash
   python -m venv Recipe_Chatbot
   source Recipe_Chatbot/bin/activate  # On Windows: Recipe_Chatbot\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the Ollama LLM model:
   ```bash
   ollama run llama3.2:1b
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
5. Open `http://127.0.0.1:8000/docs` to explore the API documentation.

---

## **Frontend (React)**

### Features:

- Upload images via drag-and-drop or file upload.
- Displays detected ingredients and allows manual edits.
- Real-time chat with a recipe chatbot.
- Dynamic recipe generation with incremental updates.

### Setup Instructions:

1. Navigate to the `recipe-maker` directory:
   ```bash
   cd recipe-maker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.

---

## **Endpoints (Backend)**

### `/upload`

- **Method**: POST
- **Description**: Uploads an image and detects ingredients using YOLO.
- **Response**:
  ```json
  {
    "file_id": "unique-id",
    "ingredients": ["tomato", "onion"]
  }
  ```

### `/recipe`

- **Method**: POST
- **Description**: Generates a recipe based on the provided ingredients.
- **Request**:
  ```json
  {
    "ingredients": ["tomato", "onion"]
  }
  ```
- **Response**:
  ```json
  {
    "recipe": "Detailed recipe text here."
  }
  ```

### `/chatbot`

- **Method**: POST
- **Description**: Responds to user queries in a culinary context.
- **Request**:
  ```json
  {
    "query": "How to prepare tomato soup?"
  }
  ```
- **Response**:
  ```json
  {
    "response": "Step-by-step instructions for tomato soup."
  }
  ```

---

## **Technologies Used**

### Backend:

- **FastAPI**: Web framework for API development.
- **YOLO**: Object detection for ingredient recognition.
- **Ollama LLM**: AI model for natural language processing.

### Frontend:

- **React**: UI development.
- **Material-UI**: Component library for styling.

---

## **Future Improvements**

- Add more fine-tuned AI models for better recipe generation.
- Enhance ingredient detection accuracy.
- Add support for multiple languages.

---

## **License**

This project is licensed under the MIT License.

---

**Happy Cooking!**

