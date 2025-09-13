from flask import Flask, request, jsonify
import requests
import os
import re

app = Flask(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message")

    # Paso 1: Preguntar a ChatGPT
    openai_url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "Eres un guía turístico experto en Bogotá. Responde con lugares reales y sus direcciones."},
            {"role": "user", "content": message},
        ],
    }

    response = requests.post(openai_url, headers=headers, json=body)
    data = response.json()
    reply = data["choices"][0]["message"]["content"]

    # Paso 2: Buscar coordenadas con Google Maps
    example_places = extract_places(reply)
    locations = []

    for place in example_places:
        geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={requests.utils.quote(place+',Bogotá')}&key={GOOGLE_API_KEY}"
        geo_res = requests.get(geo_url).json()

        if geo_res.get("results"):
            loc = geo_res["results"][0]
            locations.append({
                "name": place,
                "address": loc["formatted_address"],
                "lat": loc["geometry"]["location"]["lat"],
                "lng": loc["geometry"]["location"]["lng"],
            })

    return jsonify({"reply": reply, "locations": locations})


# Método simple para extraer nombres de lugares (puedes mejorar con NLP)
def extract_places(text):
    matches = re.findall(r"• (.*?)(?=\n|$)", text)
    return matches if matches else []


if __name__ == "__main__":
    app.run(port=4000, debug=True)
