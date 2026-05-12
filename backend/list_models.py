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
        # In the new SDK, models are listed via client.models.list()
        for m in client.models.list():
            print(f"Name: {m.name}, Base Model: {m.base_model_id}")
    except Exception as e:
        print(f"Error listing models: {e}")
