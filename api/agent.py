from iointel import (
    Agent,
    Workflow
)
from model_list import models

import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

IO_API_KEY = os.getenv("IO_API_KEY")
BASE_ENDPOINT = os.getenv("BASE_ENDPOINT")

text = """You'll now see a floating chat widget on all roadmap pages. Think of it as your personal guide while learning. You can ask it anything about the roadmap, dive deeper into any topic, get recommendations for what to learn next, or even ask it to test your knowledge.


It can also create a personalized roadmap for you, keep track of your progress, suggest project ideas, and more, all without leaving the page."""

async def get_agent_response(text: str):
    summary_agent = Agent(
        name="Summarize Agent",
        instructions="You are an assistant specialized in summarization.",
        model="mistralai/Ministral-8B-Instruct-2410",
        api_key=IO_API_KEY,
        base_url=BASE_ENDPOINT
    )

    translation_agent = Agent(
        name="Translate Agent",
        instructions="You are an assistant specialized in translation.",
        model="mistralai/Ministral-8B-Instruct-2410",
        api_key=IO_API_KEY,
        base_url=BASE_ENDPOINT
    )
    agent = Agent(
        name="Super Agent",
        instructions="You are an assistant specialized in identifying words starting with V.",
        model="mistralai/Ministral-8B-Instruct-2410",
        api_key=IO_API_KEY,
        base_url=BASE_ENDPOINT
    )
    
    workflow = Workflow(objective=text, client_mode=False)
    async def run_workflow():
        results = (await workflow.summarize_text(max_words=50,agents=[summary_agent]).translate_text(target_language="french", agents=[translation_agent]).run_tasks())["results"]
        return results

    results = await run_workflow()
    return results['summarize_text'] + "\n" + results['translate_text']
