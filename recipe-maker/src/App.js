import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  TextField,
  IconButton,
} from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
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
  const [chatResponse, setChatResponse] = useState("");

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
    } catch (err) {
      console.error("Error generating recipe:", err.message);
      addChatMessage(false, "Error generating the recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleChatQuerySubmit = async () => {
    if (!userQuery.trim()) {
      alert("Please enter a query.");
      return;
    }

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

      addChatMessage(true, userQuery);
      addChatMessage(false, `<h4>Response:</h4>${data.details.join("<br/>")}`);

      setUserQuery("");
    } catch (err) {
      alert(`Error: ${err.message}`);
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
    <div className="App" onDragOver={handleDragOver} onDrop={handleDrop}>
      <Box className="chat-header">
        <Avatar src={Logo} />
        <Typography variant="h6" className="chat-title">
          Recipe Chatbot
        </Typography>
      </Box>

      {dragging && (
        <Box className="drag-overlay">
          <Typography variant="h5">Drop your image here!</Typography>
        </Box>
      )}

      <Box className="main-container" display="flex" flexDirection="row">
        <Box
          className="chat-container"
          flex={4}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
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
            <Box className="generate-recipe-btn-chat" mt={2}>
              <Button
                variant="contained"
                className="generate-button"
                onClick={handleGenerateRecipe}
                sx={{
                  marginTop: 2,
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#45A049" },
                }}
              >
                Generate Recipe
              </Button>
            </Box>
          )}
        </Box>

        <Box className="image-viewer" flex={2} mx={2}>
          {uploadedImage ? (
            <img src={uploadedImage} alt="Uploaded" className="uploaded-image" />
          ) : (
            <Box
              className="image-placeholder"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <UploadIcon style={{ fontSize: 80, color: "white", marginBottom: 15 }} />
              <Typography
                variant="h6"
                className="placeholder-text"
                style={{ color: "white", marginBottom: 15 }}
              >
                Upload an image to see it here.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component="label"
                startIcon={<AddPhotoAlternateIcon />}
                className="upload-button"
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
          <Box className="ingredient-list" flex={2} sx={{ padding: 2 }}>
            <Typography variant="h6">Detected Ingredients:</Typography>
            <ul>
              {modifiedIngredients.map((ingredient, index) => (
                <li key={index}>
                  <TextField
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(e, index)}
                    fullWidth
                    variant="outlined"
                    label={`Ingredient ${index + 1}`}
                    margin="normal"
                  />
                  <IconButton
                    onClick={() => handleRemoveIngredient(index)}
                    color="secondary"
                  >
                    <DeleteIcon />
                  </IconButton>
                </li>
              ))}
            </ul>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddIngredient}
            >
              Add Ingredient
            </Button>
            <Button
              variant="contained"
              className="generate-button"
              onClick={handleGenerateRecipe}
            >
              Generate Recipe (List)
            </Button>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 2,
          backgroundColor: "#21222b",
          borderTop: "1px solid #333",
          borderRadius: "15px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          component="label"
          sx={{
            background: "#1a2e96",
            padding: "10px 15px",
            borderRadius: "50%",
            minWidth: 50,
            height: 50,
            marginRight: 2,
          }}
        >
          <AddPhotoAlternateIcon style={{ fontSize: 28, color: "#fff" }} />
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
          placeholder="What are you looking for?"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleChatQuerySubmit();
            }
          }}
          sx={{
            backgroundColor: "#121212",
            color: "#fff",
            borderRadius: "10px",
            padding: "10px 15px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#00000",
              },
              "&:hover fieldset": {
                borderColor: "#003a78",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#005bb5",
              },
              "& input": {
                color: "#fff", // Input text color
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#fff", // Placeholder text color
            },
          }}
        />
        
        <Button
          variant="contained"
          onClick={handleChatQuerySubmit}
          sx={{
            background: "#1a2e96",
            padding: "10px 20px",
            borderRadius: "25%",
            minWidth: 50,
            height: 50,
            marginLeft: 2,
          }}
        >
          <SendIcon style={{ fontSize: 28, color: "#fff" }} />
        </Button>
      </Box>
    </div>
  );
}

export default App;
