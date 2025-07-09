from iointel import (
    Agent,
    PersonaConfig,
    Workflow
)
from model_list import models
import re
import os
import json
from dotenv import load_dotenv
load_dotenv()

IO_API_KEY = os.getenv("IO_API_KEY")
BASE_ENDPOINT = os.getenv("BASE_ENDPOINT")

# the persona agent will create a persona based on the sample post of the user. The output should be a json structure with the fields in PersonaConfig
PERSONA_AGENT_INSTRUCTIONS = (
    "You are an assistant specialized in creating personas based on sample posts. "
    "Your task is to generate a persona that is engaging and relevant to the sample post provided."
    "Include the following fields: name, age, role, style, quirks, bio, lore, personality, conversation_style, emotional_stability, friendliness, curiosity, creativity, humor, formality, empathy."
    "The emotional_stability, friendliness, curiosity, creativity, humor, formality, and empathy should be on a scale of 0 to 1 and can be decimal values."
    "Create a persona that reflects the tone and style of the sample post."
    "Return only the JSON structure of the persona with all the above mentioned fields without any additional text or thoughts."
)

def extract_persona_json(text: str):
    """
    Extracts the JSON structure
    from the text that contains the persona information.
    """
    # Use regex to find the JSON structure in the text
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            # Attempt to parse the JSON string
            persona_json = json.loads(json_str)
            return persona_json
        except json.JSONDecodeError:
            print("Failed to decode JSON from the text.")
    return None

async def get_agent_response(sample_post: str):
    # persona config has name age role, style, domain_knowledge, quirks bio lore personality, conversation_style, description, emotional_stability
    #friendliness, curiosity, creativtity ,humor, formality, empathy
    content_agent = Agent(
        name="Persona Creator Agent",
        instructions=PERSONA_AGENT_INSTRUCTIONS,
        model="deepseek-ai/DeepSeek-R1-0528",
        api_key=IO_API_KEY,
        base_url=BASE_ENDPOINT
    )
    
    workflow = Workflow(objective=sample_post, client_mode=False)
    async def run_workflow():
        results = (await workflow.custom(name="create-persona", objective="Create a persona based on the sample prompt given", instructions=PERSONA_AGENT_INSTRUCTIONS, agents=[content_agent]).run_tasks())["results"]['create-persona']
        print(results)
        return results

    results = await run_workflow()
    persona_json = extract_persona_json(results)
    persona  = None
    if persona_json is None:
        persona = dict()
    else:
        persona = persona_json
    print(persona)
    persona_config = PersonaConfig(
        name=persona.get("name", "Default Persona"),
        age=persona.get("age", "Unknown"),
        role=persona.get("role", "Social Media Manager"),
        style=persona.get("style", "Casual"),
        domain_knowledge=["Social Media Trends"],
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
    # return persona_config
    return persona_config.dict()