import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

app = Flask(__name__)

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


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    city = data.get("city", "")
    days = data.get("days", "")
    month = data.get("month", "")
    interests = data.get("interests", [])
    preference = ", ".join(interests)

    if not city or not days or not month or not preference:
        return jsonify(
            {"error": "Please fill in all fields and select at least one interest."}
        ), 400

    llm_chain = template | get_llm() | StrOutputParser()
    ai_msg = llm_chain.invoke(
        {
            "city": city,
            "days": days,
            "month": month,
            "preference": preference,
        }
    )

    return jsonify({"itinerary": ai_msg})


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
