import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()


def main():

    template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a travel agent that provides a travel itinerary based on which city the user wants to go, how many days, and what they are interested in. Please respond in the format below:

                Here is your {days}-day travel itinerary for {city} during {month}:

                **Best Time to Visit:** [Weather and seasonal tips for {month}]

                **Daily Itinerary:**

                Day 1:
                - Morning: [Activity based on {preference}]
                - Afternoon: [Activity based on {preference}]
                - Evening: [Dinner or nightlife suggestion]

                [Repeat for each day up to {days}]

                **Local Tips:**
                - [Transportation, cultural norms, must-try food]

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

    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview", api_key=os.getenv("GOOGLE_API_KEY")
    )

    print(
        "API Key loaded:",
        "Yes" if os.getenv("GOOGLE_API_KEY") else "NO - check your .env file!",
    )

    city = input("Which city do you want to travel to? ")
    days = input("How many days are you planning to stay? ")
    month = input("What month are you going? ")
    preference = input("What 4 things does your vacation must have? ")

    print("Sending request to AI...")

    llm_chain = template | llm | StrOutputParser()
    ai_msg = llm_chain.invoke(
        {
            "city": city,
            "days": days,
            "month": month,
            "preference": preference,
        }
    )

    print(ai_msg)


if __name__ == "__main__":
    main()
