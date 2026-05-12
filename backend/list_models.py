import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("GOOGLE_API_KEY not found")
else:
    client = genai.Client(api_key=api_key)
    print("Available models:")
    try:
        for m in client.models.list():
            # Print the whole object to see attributes if needed, or just name
            print(f"Name: {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
