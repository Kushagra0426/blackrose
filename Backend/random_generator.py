import asyncio
import random
from datetime import datetime
from database import store_random_number

async def start_random_number_generator():
    try:
        while True:
            random_number = random.randint(1, 100)
            timestamp = datetime.now()
            await store_random_number(timestamp, random_number)
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        print("Random number generator stopped.")

# async def get_latest_random_number():
#     # Fetch the latest random number from the database
#     pass  # Implement this function