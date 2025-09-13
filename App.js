import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [locations, setLocations] = useState([]); // Lugares recomendados para el mapa

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);

    try {
      const res = await fetch("http://10.0.2.2:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage = { role: "assistant", content: data.reply };

      setMessages((prev) => [...prev, botMessage]);

      // Verifica si el backend envía ubicaciones
      if (data.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error(err);
    }

    setInput("");
  };

  const renderItem = ({ item }) => (
    <View style={[styles.message, item.role === "user" ? styles.user : styles.assistant]}>
      <Text style={styles.text}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        style={styles.chat}
      />

      {/* Mapa */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 4.711, // Bogotá centro
          longitude: -74.0721,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {locations.map((loc, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            title={loc.name}
            description={loc.address}
          />
        ))}
      </MapView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta por un lugar..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.button}>
          <Text style={styles.buttonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  chat: { flex: 1, padding: 10 },
  map: { width: Dimensions.get("window").width, height: 200 },
  message: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: "80%" },
  user: { backgroundColor: "#007bff", alignSelf: "flex-end" },
  assistant: { backgroundColor: "#28a745", alignSelf: "flex-start" },
  text: { color: "#fff" },
  inputContainer: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#ccc" },
  input: { flex: 1, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 15, borderWidth: 1, borderColor: "#ccc" },
  button: { marginLeft: 10, backgroundColor: "#007bff", borderRadius: 20, paddingHorizontal: 15, justifyContent: "center" },
  buttonText: { color: "#fff" },
});
