import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

app = Flask(__name__)

VALID_MONTHS = {
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
}

VALID_INTERESTS = {
    "Good Food", "Urban Vibes", "Nature", "Off the Beaten Path",
    "Nightlife", "History & Culture", "Free Things to Do", "Shopping",
}

MAX_CITY_LENGTH = 100

template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a travel agent that provides a travel itinerary based on which city the user wants to go, how many days, and what they are interested in. Please respond in the format below:

            Here is your {days}-day travel itinerary for {city} during {month}:

            **Daily Itinerary:**

            Day 1:
            - Morning: [Activity based on {preference}]
            - Afternoon: [Activity based on {preference}]
            - Evening: [Dinner or nightlife suggestion]

            [Repeat for each day up to {days}]

            **Local Tips:**
            - [Transportation, cultural norms, must-try food]

            **Recommended Restaurants:**
            - [5 recommended restaurants with their Google Map star rating provided]

            **Estimated Budget:**
            - [Rough daily cost breakdown]

            Enjoy your trip to {city}! Let me know if you'd like to adjust anything.
            """,
        ),
        (
            "human",
            "I'm planning to go to {city} for {days} days during {month}. I'm interested in {preference}",
        ),
    ]
)


def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-pro",
        api_key=os.getenv("GOOGLE_API_KEY"),
    )


def sanitize_city(city):
    """Strip control characters and collapse whitespace."""
    cleaned = "".join(ch for ch in city if ch.isprintable())
    return " ".join(cleaned.split()).strip()


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request."}), 400

    city = sanitize_city(str(data.get("city", "")))
    month = str(data.get("month", ""))
    interests = data.get("interests", [])

    # Validate days is a number in range
    try:
        days = int(data.get("days", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Days must be a number."}), 400
    if days < 1 or days > 30:
        return jsonify({"error": "Days must be between 1 and 30."}), 400

    # Validate city
    if not city or len(city) > MAX_CITY_LENGTH:
        return jsonify({"error": "Please enter a valid destination (max 100 characters)."}), 400

    # Validate month against whitelist
    if month not in VALID_MONTHS:
        return jsonify({"error": "Please select a valid month."}), 400

    # Validate interests against whitelist
    if not isinstance(interests, list) or not interests:
        return jsonify({"error": "Please select at least one interest."}), 400
    invalid = [i for i in interests if i not in VALID_INTERESTS]
    if invalid:
        return jsonify({"error": "Invalid interest selection."}), 400

    preference = ", ".join(interests)

    llm_chain = template | get_llm() | StrOutputParser()
    ai_msg = llm_chain.invoke(
        {
            "city": city,
            "days": str(days),
            "month": month,
            "preference": preference,
        }
    )

    return jsonify({"itinerary": ai_msg})


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
