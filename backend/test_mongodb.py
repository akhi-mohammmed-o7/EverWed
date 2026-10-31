import os
import asyncio
from pathlib import Path
from urllib.parse import quote_plus
from pymongo import AsyncMongoClient
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

async def main():
    uri = os.getenv("MONGODB_URI")
    database = os.getenv("MONGODB_DATABASE", "everwed")

    if not uri:
        print("ERROR: MONGODB_URI not found in .env")
        return

    client = AsyncMongoClient(uri, serverSelectionTimeoutMS=10000)

    try:
        result = await client.admin.command("ping")
        print("SUCCESS: MongoDB Atlas connection works!")
        print("Ping:", result)
        print("Database:", database)

        db = client[database]
        print("Database access successful:", db.name)

    except Exception as e:
        print("CONNECTION FAILED")
        print("Error:", type(e).__name__)
        print("Details:", str(e).splitlines()[0][:300])

    finally:
        await client.close()

asyncio.run(main())