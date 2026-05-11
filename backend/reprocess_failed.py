import asyncio
import os
from dotenv import load_dotenv

# Standard relative imports are tricky in standalone scripts, 
# so we use absolute imports and assume the script is run from the backend directory.
from app.api.upload import process_file
from app.db.mongodb import connect_to_mongo, close_mongo_connection

load_dotenv()

async def reprocess():
    await connect_to_mongo()
    
    # ID card.pdf info
    file_id = "307f59b4-090b-45dc-ad0e-8044e18cfd8f"
    file_path = os.path.join("uploads", "307f59b4-090b-45dc-ad0e-8044e18cfd8f.pdf")
    filename = "ID card.pdf"
    content_type = "application/pdf"
    
    print(f"Reprocessing {filename}...")
    await process_file(file_id, file_path, filename, content_type)
    print("Reprocessing complete.")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(reprocess())
