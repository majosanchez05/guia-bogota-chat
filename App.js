import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://10.0.2.2:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage = { role: "assistant", content: data.reply };

      setMessages((prev) => [...prev, botMessage]);
      if (data.locations) setLocations(data.locations);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Hubo un error al obtener respuesta." },
      ]);
    }

    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.role === "user" ? styles.user : styles.assistant,
      ]}
    >
      <Text style={styles.text}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        style={styles.chat}
        onContentSizeChange={() =>
          flatListRef.current.scrollToEnd({ animated: true })
        }
        onLayout={() =>
          flatListRef.current.scrollToEnd({ animated: true })
        }
      />

      {/* Loading Indicator */}
      {loading && (
        <ActivityIndicator size="large" color="#007bff" style={{ margin: 10 }} />
      )}

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pregunta por un lugar..."
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.button, loading && { opacity: 0.6 }]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "..." : "Enviar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  chat: { flex: 1, padding: 10 },
  map: { width: Dimensions.get("window").width, height: 200 },
  message: {
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#007bff",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  assistant: {
    backgroundColor: "#28a745",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  text: { color: "#fff", fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    marginLeft: 10,
    backgroundColor: "#007bff",
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

