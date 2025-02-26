import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  IconButton,
  Paper,
  Container,
} from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ChatIcon from "@mui/icons-material/Chat";
import ImageIcon from "@mui/icons-material/Image";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BotLogo from "./chef-avatar.png";
import Logo from "./2.png";
import "./App.css";
import UploadIcon from "@mui/icons-material/Upload";
import { marked } from "marked";

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [modifiedIngredients, setModifiedIngredients] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processImage(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processImage(file);
  };

  const processImage = (file) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    uploadImage(file);
    // Switch to chat tab on mobile after uploading
    if (window.innerWidth <= 768) {
      setActiveTab("chat");
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const detectedIngredients = data.ingredients
        ? Object.keys(data.ingredients)
        : [];

      setIngredients(detectedIngredients);
      setModifiedIngredients(detectedIngredients);
      addChatMessage(
        false,
        `<h4>Detected Ingredients:</h4><ul>${detectedIngredients
          .map((ing) => `<li>${ing}</li>`)
          .join("")}</ul>`
      );
      setShowGenerateButton(true);
    } catch (err) {
      addChatMessage(false, "Error uploading the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientChange = (e, index) => {
    const updatedIngredients = [...modifiedIngredients];
    updatedIngredients[index] = e.target.value;
    setModifiedIngredients(updatedIngredients);
  };

  const handleAddIngredient = () => {
    setModifiedIngredients([...modifiedIngredients, ""]);
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = modifiedIngredients.filter((_, i) => i !== index);
    setModifiedIngredients(updatedIngredients);
  };

  const handleGenerateRecipe = async () => {
    if (modifiedIngredients.length === 0) {
      addChatMessage(false, "No ingredients detected. Please upload an image first.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: modifiedIngredients }),
      });
  
      const data = await response.json();
      console.log("Recipe response data:", data); // Debugging log
  
      if (!data || !data.subsections || !Array.isArray(data.subsections)) {
        throw new Error("Invalid response format from the server.");
      }
  
      const formattedContent = data.subsections
        .map((section) => {
          const contentList = Array.isArray(section.items)
            ? `<ul>${section.items.map((item) => `<li>${item}</li>`).join("")}</ul>`
            : Array.isArray(section.steps)
            ? section.steps.map((step) => marked(step)).join("")
            : "";
  
          return `<h5>${section.heading}</h5>${contentList}`;
        })
        .join("");
  
      addChatMessage(false, `<h4>Generated Recipe:</h4>${formattedContent}`);
      setShowGenerateButton(false);
      
      // Switch to chat tab on mobile after generating recipe
      if (window.innerWidth <= 768) {
        setActiveTab("chat");
      }
    } catch (err) {
      console.error("Error generating recipe:", err.message);
      addChatMessage(false, "Error generating the recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChatQuerySubmit = async () => {
    if (!userQuery.trim()) {
      return;
    }

    addChatMessage(true, userQuery);
    setLoading(true);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Server error: ${response.status} - ${errorData.detail || "Unknown error"}`
        );
      }

      const data = await response.json();
      addChatMessage(false, `<h4>Response:</h4>${data.details.join("<br/>")}`);
      setUserQuery("");
    } catch (err) {
      addChatMessage(false, `Error: ${err.message}. Please try again.`);
      console.error("Error during chat query:", err);
    } finally {
      setLoading(false);
    }
  };

  const addChatMessage = (isUser, content) => {
    const isCode = content.startsWith("<code>");

    setChatHistory((prev) => [
      ...prev,
      {
        isUser,
        content,
        isHtml: !isCode,
        isCode,
      },
    ]);
  };

  return (
    <div 
      className={`App show-${activeTab}`} 
      onDragOver={handleDragOver} 
      onDragLeave={handleDragLeave} 
      onDrop={handleDrop}
    >
      <Box className="chat-header">
        <Avatar src={Logo} sx={{ width: 40, height: 40 }} />
        <Typography variant="h6" className="chat-title">
          Recipe Chatbot
        </Typography>
      </Box>

      {dragging && (
        <Box className="drag-overlay">
          <Paper 
            elevation={3} 
            sx={{ 
              padding: 4, 
              backgroundColor: 'rgba(30, 41, 59, 0.9)', 
              borderRadius: 2,
              border: '2px dashed #3b82f6'
            }}
          >
            <UploadIcon sx={{ fontSize: 60, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'white' }}>
              Drop your image here!
            </Typography>
          </Paper>
        </Box>
      )}

      <Box className="main-container">
        <Box className="chat-container">
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
            {chatHistory.map((msg, index) => (
              <Box
                key={index}
                className={`chat-bubble ${msg.isUser ? "user" : "bot"}`}
              >
                {!msg.isUser && <Avatar src={BotLogo} className="bot-avatar" />}
                <Box className="chat-content">
                  {msg.isCode ? (
                    <SyntaxHighlighter language="javascript" style={dark}>
                      {msg.content}
                    </SyntaxHighlighter>
                  ) : msg.isHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  ) : (
                    <Typography>{msg.content}</Typography>
                  )}
                </Box>
              </Box>
            ))}
            {loading && (
              <Box className="loading-spinner-container">
                <img src={BotLogo} alt="Logo" className="logo" />
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </Box>
            )}
          </Box>
          {showGenerateButton && ingredients.length > 0 && (
            <Button
              variant="contained"
              className="generate-button"
              onClick={handleGenerateRecipe}
              disableElevation
            >
              Generate Recipe
            </Button>
          )}
        </Box>

        <Box className="image-viewer">
          {uploadedImage ? (
            <img src={uploadedImage} alt="Uploaded" className="uploaded-image" />
          ) : (
            <Box className="image-placeholder">
              <UploadIcon sx={{ fontSize: 60, color: "#3b82f6", mb: 2 }} />
              <Typography variant="h6" className="placeholder-text">
                Upload an image of ingredients
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<AddPhotoAlternateIcon />}
                className="upload-button"
                disableElevation
              >
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
              </Button>
            </Box>
          )}
        </Box>

        {ingredients.length > 0 && (
          <Box className="ingredient-list">
            <Typography variant="h6">Detected Ingredients</Typography>
            <ul>
              {modifiedIngredients.map((ingredient, index) => (
                <li key={index}>
                  <TextField
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(e, index)}
                    fullWidth
                    variant="outlined"
                    label={`Ingredient ${index + 1}`}
                    margin="dense"
                    InputProps={{
                      sx: { color: 'white' }
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveIngredient(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </li>
              ))}
            </ul>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddIngredient}
                sx={{ 
                  flex: 1, 
                  borderColor: '#3b82f6', 
                  color: '#3b82f6',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(59, 130, 246, 0.04)'
                  }
                }}
              >
                Add
              </Button>
              <Button
                variant="contained"
                className="generate-button"
                onClick={handleGenerateRecipe}
                disableElevation
                sx={{ flex: 1 }}
              >
                Generate
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      <Box className="input-area">
        <Button
          variant="contained"
          component="label"
          className="input-button"
          disableElevation
        >
          <AddPhotoAlternateIcon />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </Button>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask about recipes, cooking tips, or ingredients..."
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleChatQuerySubmit();
            }
          }}
          className="input-field"
          InputProps={{
            sx: { 
              color: 'white',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }}
        />
        
        <Button
          variant="contained"
          onClick={handleChatQuerySubmit}
          className="input-button"
          disableElevation
          sx={{ ml: 1 }}
        >
          <SendIcon />
        </Button>
      </Box>

      {/* Mobile Navigation */}
      <Box className="mobile-nav">
        <Box 
          className={`mobile-nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <ChatIcon />
          <Typography variant="caption">Chat</Typography>
        </Box>
        <Box 
          className={`mobile-nav-button ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <ImageIcon />
          <Typography variant="caption">Image</Typography>
        </Box>
        {ingredients.length > 0 && (
          <Box 
            className={`mobile-nav-button ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <ListAltIcon />
            <Typography variant="caption">Ingredients</Typography>
          </Box>
        )}
      </Box>
    </div>
  );
}

export default App;