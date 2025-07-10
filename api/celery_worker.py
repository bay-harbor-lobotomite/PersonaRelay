# celery_worker.py
import asyncio
import redis
import json
from celery_config import celery_app
from websocket_manager import manager as connection_manager
from nostr_utils import post_to_nostr_util as post_to_nostr_network

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

async def _async_post_and_notify(message_id: str, message_text: str):
    print(f"Executing async post for message_id: {message_id}")
    await post_to_nostr_network(message_text)
    print(f"Successfully posted message_id: {message_id}")
    
    
@celery_app.task(name="tasks.schedule_post")
def schedule_post_task(message_id: str, message_text: str):
    status = "failed"
    try:
        print(f"Executing post for message_id: {message_id}")
        
        asyncio.run(_async_post_and_notify(message_id, message_text))
        
        status = "posted"
        print(f"Successfully posted message_id: {message_id}")

    except Exception as e:
        print(f"Failed to post message_id: {message_id}. Error: {e}")
        status = "failed"
    
    finally:
        print(f"Publishing update to Redis for message_id: {message_id} with status: {status}")
        message_payload = json.dumps({
            "type": "update",
            "message_id": message_id,
            "status": status
        })
        redis_client.publish("task_updates", message_payload)