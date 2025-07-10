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

## System Architecture

<img width="861" height="598" alt="image" src="https://github.com/user-attachments/assets/7f513fe4-ba26-43e1-907b-3ab605656e52" />

## Project Structure
```
PersonaRelay/ (Project Root)
├── frontend/ (Next.js Application)
│ ├── app/
| | ├── generate
| | ├── dashboard
│ │ ├── page.tsx
│ │ └── layout.tsx
│ ├── ui/
│ │ ├── components/ // Generic, reusable UI components (Button.tsx, Modal.tsx)
│ ├── lib/ //helpers and API functions
| ├── globals.css
│ ├── package.json
│ └── next.config.js
└── api/ (FastAPI Application)
│ ├── __init__.py
| ├── main.py // main API routes
| ├── auth.py // auth functions
| ├── agents/ // agent definitions
| ├── nostr_utils.py // utils for posting to nostr
| ├── celery_worker.py // Defines the schedule_post_task
| ├── celery_config.py // Defines the celery ap
| ├── requirements.txt // Python dependencies
| └── .env // Environment variables (NEVER commit this)
```

## Usage and Flow

### Phase 1: Persona Forging

This phase covers the initial setup where a user creates a new AI-powered persona based on their unique writing style.

1.  **Initiate Creation**
    *   The user lands on the main dashboard and clicks the prominent **`Create New Persona`** button.
2.  **Automated Voice Analysis (The "Magic" Step)**
3.  
    *   The user is prompted to paste sample text (e.g., a blog post, a few tweets, or a mission statement) into a large textarea.
    *   After pasting the text, the user clicks the **`Generate Persona`** button. The system sends the provided text to the IO Intelligence API for a deep analysis of tone, style, and characteristics.
    *   
4.  **Review and Refine**
    *   The form fields within the modal (such as *Name*, *Role*, *Description*, *Conversation Style*, and personality trait sliders) are automatically populated with the data returned from the AI's analysis.
    *   The user has the opportunity to review these auto-generated details and make any manual adjustments or refinements. Once satisfied, the user clicks the final **`Create Persona`** button.
    *   The new persona profile is saved to the database and immediately appears in the user's list of available personas on the dashboard.

### Phase 2: Content Generation & Scheduling

1.  **Select an Identity**
    *   On the main dashboard, the user selects one of their created personas from a dropdown menu. This action sets the active "voice" for all subsequent content generation.

2.  **Craft a Post from a Prompt**
    *   The user types a simple instruction or topic into the main prompt box (e.g., "Write a post about the importance of decentralized social media").
    *   They click the **`Generate Post`** button.
    *   The system uses both the user's prompt and the full context of the active persona to generate a tailored, in-character social media post.

4.  **Schedule the Post via Drag-and-Drop**
    *   The user clicks and **drags** the post from the "Unscheduled Posts" area.
    *   They **drop** the card directly onto a desired date in the calendar interface.
    *   The post is now officially scheduled. A corresponding event appears on the calendar, indicating it is in the queue for automated publishing. The user can continue this process to build out their entire content pipeline.

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
        celery -A celery_config.celery_app worker --loglevel=info -P gevent
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
