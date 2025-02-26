# **🍽️ Recipe Chatbot (FastAPI + React + Groq API)**  

This repository contains a **Recipe Chatbot** that allows users to upload images of ingredients, detect the ingredients, and generate recipes using AI models like **YOLO for image detection** and **Groq API for recipe generation**.

---

## **🎥 Demo**
![Recipe Chatbot Demo](Output/Recipe%20Chatbot.gif)

---

# **📁 Project Structure**

```
LLVIS_FRUITS_AND_VEGETABLES
├── backend
│   ├── Recipe_Chatbot/              # Virtual environment folder
│   ├── uploads/                    # Folder to save uploaded images
│   ├── runs/                       # YOLO runs folder
│   ├── main.py                     # FastAPI server
│   ├── requirements.txt            # Python dependencies
│   ├── yolo_fruits_and_vegetables_v8x.pt # YOLO model weights
│   ├── .env                        # Environment file (API keys)
│   ├── Procfile                    # Deployment file (optional)
├── frontend
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
│   ├── .env                        # Environment file (Backend URL)
├── README.md                      # Documentation
```

---

# **🚀 Backend (FastAPI + Groq API)**

## **✅ Features**
- **Image Upload**: Detects ingredients in images using YOLO.
- **Recipe Generation**: Generates recipes based on detected ingredients using **Groq API**.
- **Chatbot**: Interactive chatbot to assist users with culinary questions.

---

## **🔧 Setup Instructions**
### **1️⃣ Install Dependencies**
```bash
cd backend
python -m venv Recipe_Chatbot
source Recipe_Chatbot/bin/activate  # On Windows: backend\Recipe_Chatbot\Scripts\activate
pip install -r requirements.txt
```

### **2️⃣ Setup `.env` File**
Create a `.env` file in the **backend folder**:
```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
```

### **3️⃣ Run FastAPI Server**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
📌 **Open `http://127.0.0.1:8000/docs` to explore API documentation.**

---

## **🔗 Connecting to Groq API**
Groq API is used to **generate recipes and chat responses**.  
Ensure you have a **Groq API key** from [Groq.com](https://console.groq.com/).

### **Backend Code (`main.py`)**
Modify **`main.py`** to load Groq API key from `.env`:
```python
import os
from dotenv import load_dotenv
import requests

# Load API key from .env file
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def query_groq(prompt):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    response = requests.post(GROQ_API_URL, json=payload, headers=headers)
    return response.json()["choices"][0]["message"]["content"]
```

---

# **💻 Frontend (React)**
## **✅ Features**
- Upload images via drag-and-drop or file upload.
- Displays detected ingredients and allows manual edits.
- Real-time chat with a recipe chatbot.
- Dynamic recipe generation with AI.

---

## **🔧 Setup Instructions**
### **1️⃣ Install Dependencies**
```bash
cd frontend
npm install
```

### **2️⃣ Setup `.env` File**
Create a `.env` file in the **frontend folder**:
```
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

### **3️⃣ Start React Frontend**
```bash
npm start
```
📌 **Open `http://localhost:3000` to see your app.**

---

# **📡 API Endpoints (Backend)**

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
- **Description**: Generates a recipe based on detected ingredients.

### `/chatbot`
- **Method**: POST
- **Description**: Responds to user queries in a culinary context.

---

# **📌 Summary**
✅ **Uses Groq API for AI-powered recipe generation**  
✅ **Uses `.env` for secure API key management**  
✅ **Fully functional FastAPI backend & React frontend**  

🚀 **Your app is now ready for deployment!** Let me know if you need any help! 🔥😊

---

## **License**

## Copyright

Copyright (c) 2025, Alok Ahirrao

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.  
You may use and modify this project for personal or educational purposes, but commercial use is prohibited without explicit permission.  

For more details, see the [LICENSE](./LICENSE) file or contact alokahirrao.ai@gmail.com .


---

**Happy Cooking!**

