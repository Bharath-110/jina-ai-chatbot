from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse, JSONResponse
import json

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Allow both Next.js frontend ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JINA_API_KEY = os.getenv("JINA_API_KEY")
JINA_API_URL = "https://deepsearch.jina.ai/v1/chat/completions"

# Verify API key on startup
if not JINA_API_KEY:
    print("Warning: JINA_API_KEY not found in environment variables")
else:
    print("JINA API key loaded successfully")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse({"status": "ok"})

@app.post("/api/chat")
async def chat_stream(message: dict):
    if not JINA_API_KEY:
        raise HTTPException(status_code=500, detail="Jina API key not configured")
    
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # Get conversation history from the frontend
    conversation = message.get("messages", [])
    if not conversation:
        # If no history provided, create a new conversation with just the current message
        conversation = [{"role": "user", "content": message.get("content", "")}]
    
    payload = {
        "model": "jina-deepsearch-v1",
        "messages": conversation,
        "stream": True,
        "reasoning_effort": "medium",
        "max_attempts": 1,
        "no_direct_answer": False
    }
    
    try:
        response = requests.post(
            JINA_API_URL,
            headers=headers,
            json=payload,
            stream=True
        )
        
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API key")
        elif response.status_code != 200:
            error_detail = "Error from Jina API"
            try:
                error_json = response.json()
                if error_json.get("detail"):
                    error_detail = error_json["detail"]
            except:
                pass
            raise HTTPException(status_code=response.status_code, detail=error_detail)
        
        def generate():
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode('utf-8').replace('data: ', ''))
                        if data.get("choices") and data["choices"][0].get("delta", {}).get("content"):
                            yield f"data: {json.dumps({'content': data['choices'][0]['delta']['content']})}\n\n"
                    except json.JSONDecodeError:
                        continue
                    except Exception as e:
                        print(f"Error processing line: {str(e)}")
                        continue
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
    
    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Jina API: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 