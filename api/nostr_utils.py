from dotenv import load_dotenv
import os
from typing import Any, Dict, List, Optional
from nostr_sdk import Client, EventBuilder, Keys, NostrSigner
load_dotenv()

async def post_to_nostr_util(content: str) -> Any:
    print("boof")
    keys = Keys.parse(os.getenv("NOSTR_SECRET_KEY", ""))
    signer = NostrSigner.keys(keys)
    client = Client(signer)

    await client.add_relay("wss://relay.damus.io")
    await client.connect()

    builder = EventBuilder.text_note(content)
    output = await client.send_event_builder(builder)
    return output