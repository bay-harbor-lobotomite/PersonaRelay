# PersonaRelay 🎭

**Your Authentic AI Ghostwriter for the Decentralized Web.**

## Summary

PersonaRelay is a sophisticated social media automation platform designed for creators, developers, and brands who want to maintain a powerful and authentic presence on decentralized networks like Nostr.

In a world demanding constant content, it's easy to lose your unique voice. PersonaRelay solves this by not just generating text, but by first understanding your **digital voiceprint**. Using the **IO Intelligence API and Agents SDK**, it analyzes your writing style to create a rich AI Persona. This persona then becomes your AI ghostwriter, crafting on-brand content from simple prompts.

With an intuitive drag-and-drop calendar, robust background scheduling, and a polished, animated UI, PersonaRelay transforms content strategy from a chore into a seamless, automated, and genuinely authentic experience.

## Features

*   **🧠 Instant Persona Generation:** Leverage the IO Intelligence API and Agents SDK to create a detailed AI persona in seconds from a sample text, capturing tone, style, and quirks. From sample post to PersonaConfig in a few seconds.
*   🎭 **Multi-Persona Management:** Effortlessly create and switch between different "voiceprints" to manage your personal brand, your startup, and your side projects from a single dashboard.
*   ✍️ **Persona-Driven Content Crafting:** The AI doesn't just answer a prompt; it answers *in character*, ensuring every post is authentically aligned with the chosen persona.
*   🗓️ **Drag-and-Drop Content Scheduler:** A beautiful, fully-themed calendar interface allows for intuitive scheduling. Drag a post to a date, and our backend handles the rest. Move it, and it's instantly rescheduled.
*   ⚡ **Asynchronous Task Scheduling:** Powered by **Celery** and **Redis**, the backend handles all posts asynchronously. The UI is always fast, and posts are delivered reliably, even for past-due items.
*   🌐 **Native Nostr Integration:** Publish directly to the decentralized and censorship-resistant **Nostr** network, engaging with the future of social media.

## Tech Stack

| Category                | Technology / Library                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Frontend**            | **Next.js**, **React**, Tailwind CSS                                              |
| **UI & Animation**      | **Framer Motion**, React Big Calendar, React Modal                                |
| **Backend**             | **FastAPI** (Python)                                                              |
| **AI Features**           | **IO Intelligence API**, **IO Agents SDK**                                                          |
| **Async Task Queue**    | **Celery**, **Redis**                                                             |
| **Database**            | **MongoDB**                                                                       |
| **Target Social Network** | **Nostr Protocol**                                                                |

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

You will need the following software installed on your machine:

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   [Python](https://www.python.org/downloads/) (v3.10 or later)
*   [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose (for running Redis)
*   A code editor like [VS Code](https://code.visualstudio.com/)

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/bay-harbor-lobotomite/PersonaRelay.git
cd PersonaRelay
```
#### 2. Backend Setup (/api directory)
The backend runs the FastAPI server, the Celery task scheduler, and Redis.
1) **Navigate to the backend directory**
```bash
cd api
```
2) **Create and activate a Python virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```
3) **Install Python dependencies:**
(Make sure you have a requirements.txt file in your backend folder)
```bash
pip install -r requirements.txt
```
4) Create an environment file similar to the one in ```.env.example.```  
5) **Start the services (3 separate terminals):**  
    
    - **Terminal 1: Start Redis using Docker:**  
     ```bash
        docker run -d -p 6379:6379 redis
     ```
    
    - **Terminal 2: Start the Celery worker:**
     ```bash
        celery -A celery_worker.celery_app worker --loglevel=info -P gevent
     ```    
    
    - **Terminal 3: Start the FastAPI server:**
     ```bash
        uvicorn main:app --reload
      ```
    
Your backend should now be running on http://localhost:8000.

#### 3. Frontend Setup (/frontend directory)
The frontend is a Next.js app
1) **Navigate to the frontend directory (from the root)**
```bash
cd frontend
```
2) **Install Node.js dependencies:**
```bash
npm install
```
3) **Run the Next.js development server**
```bash
npm run dev
```
Your frontend application should now be accessible at http://localhost:3000. Open it in your browser and start creating posts.
