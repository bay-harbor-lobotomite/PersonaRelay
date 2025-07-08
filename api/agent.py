from iointel import (
    Agent,
    PersonaConfig,
    Workflow,
    register_tool
)
from duckduckgo_search import DDGS
from model_list import models
import re
import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

IO_API_KEY = os.getenv("IO_API_KEY")
BASE_ENDPOINT = os.getenv("BASE_ENDPOINT")

@register_tool
def search_duckduckgo(query: str, num_results: int = 5):
    """Search DuckDuckGo and return the top results."""
    with DDGS() as ddgs:
        results = ddgs.text(query, max_results=num_results)
        return ", ".join([result['body'] for result in results]   )

# the content agent will create a catchy social media post based on the prompt of the user 
CONTENT_AGENT_INSTRUCTIONS = (
    "You are an assistant specialized in creating catchy social media posts. "
    "Your task is to generate a post that is engaging and relevant to the topic provided. "
    "Make sure to include hashtags and emojis where appropriate."
    "Create a crisp and short post, don't add multiple punchlines"
    "You may use the search function to find relevant information online."
    "Don't think too much and don't return your thoughts, just return the content of the post."
)
def parse_thoughts_and_content(text):
    # Find all thoughts
    thoughts = re.findall(r"<think>(.*?)</think>", text, re.DOTALL)

    # Remove the thoughts from the original string
    non_thoughts = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    return thoughts, [non_thoughts] if non_thoughts else []

async def get_agent_response(text: str, persona: any):
    summary_agent = Agent(
        name="Summarize Agent",
        instructions="You are an assistant specialized in summarization.",
        model="mistralai/Ministral-8B-Instruct-2410",
        api_key=IO_API_KEY,
        base_url=BASE_ENDPOINT
    )
    # persona config has name age role, style, domain_knowledge, quirks bio lore personality, conversation_style, description, emotional_stability
    #friendliness, curiosity, creativtity ,humor, formality, empathy
    persona_config = PersonaConfig(
        name=persona.get("name", "Default Persona"),
        age=persona.get("age", "Unknown"),
        role=persona.get("role", "Social Media Manager"),
        style=persona.get("style", "Casual"),
        domain_knowledge=persona.get("domain_knowledge", ["Social Media Trends"]),
        quirks=persona.get("quirks", "Loves puns"),
        bio=persona.get("bio", "A social media enthusiast with a knack for catchy posts."),
        lore=persona.get("lore", "Has a background in marketing and loves to engage with audiences."),
        personality=persona.get("personality", "Friendly and creative"),
        conversation_style=persona.get("conversation_style", "Conversational"),
        emotional_stability=persona.get("emotional_stability", 1),
        friendliness=persona.get("friendliness", 1),
        curiosity=persona.get("curiosity", 1),
        creativity=persona.get("creativity", 1),
        humor=persona.get("humor", 1),
        formality=persona.get("formality", 1),
        empathy=persona.get("empathy", 1)  
    )
    content_agent = Agent(
        name="Content Agent",
        instructions=CONTENT_AGENT_INSTRUCTIONS,
        model="deepseek-ai/DeepSeek-R1-0528",
        persona=persona_config,
        api_key=IO_API_KEY,
        base_url=BASE_ENDPOINT
    )
    
    workflow = Workflow(objective=text, client_mode=False)
    async def run_workflow():
        results = (await workflow.custom(name="create-social-media-post", objective="Create a social media post based on the objective", instructions=CONTENT_AGENT_INSTRUCTIONS, agents=[content_agent]).run_tasks())["results"]['create-social-media-post']
        # remove thoughts from the results
        # the thoughts are enclosed in <think> </think>
        print(results)
        thoughts, content = parse_thoughts_and_content(results)
        return content[0] if content else ""

    results = await run_workflow()
    return results
