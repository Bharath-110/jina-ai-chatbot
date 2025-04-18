# Jina AI Chat Application

A full-stack chat application with a Next.js frontend and FastAPI backend, featuring real-time message streaming and a modern UI.

## Project Structure

```
├── frontend/         # Next.js frontend application
└── backend/         # FastAPI backend server
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On Unix or MacOS:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file with your configuration.

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- 🎨 Modern UI with dark/light theme support
- 💬 Real-time message streaming
- 🔄 Connection status indicator
- 📱 Responsive design
- ⚡ Fast and smooth animations
- 🎯 Clean and maintainable code structure

## Tech Stack

### Frontend
- Next.js 13+
- React 18
- Tailwind CSS
- TypeScript
- shadcn/ui components

### Backend
- FastAPI
- Python 3.8+
- Jina AI integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this code for your own projects. 