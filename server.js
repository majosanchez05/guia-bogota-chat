import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // Paso 1: Preguntar a ChatGPT
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un guía turístico experto en Bogotá. Responde con lugares reales y sus direcciones." },
        { role: "user", content: message },
      ],
    }),
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;

  // Paso 2: Buscar coordenadas con Google Maps
  const examplePlaces = extractPlaces(reply); // Extraer nombres (ejemplo básico)

  const locations = [];
  for (let place of examplePlaces) {
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        place
      )},Bogotá&key=${GOOGLE_API_KEY}`
    );
    const geoData = await geoRes.json();
    if (geoData.results[0]) {
      const loc = geoData.results[0];
      locations.push({
        name: place,
        address: loc.formatted_address,
        lat: loc.geometry.location.lat,
        lng: loc.geometry.location.lng,
      });
    }
  }

  res.json({ reply, locations });
});

// Método simple para extraer nombres de lugares (se puede mejorar con NER)
function extractPlaces(text) {
  return text.match(/• (.*?)(?=\n|$)/g)?.map(p => p.replace("• ", "")) || [];
}

app.listen(4000, () => console.log("Servidor en http://localhost:4000"));
