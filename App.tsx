//@refresh reset
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Button } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import { GiftedChat } from "react-native-gifted-chat";
import * as firebase from 'firebase'
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPf78aGiegwerQAMlwG1u5uv2upSqxtQo",
  authDomain: "ifs-assignment.firebaseapp.com",
  projectId: "ifs-assignment",
  storageBucket: "ifs-assignment.appspot.com",
  messagingSenderId: "964047987797",
  appId: "1:964047987797:web:a565c04e101e48a68ee0dc",
};

//add this line of code to avoid initialize more than one app.
if (firebase.default.apps.length === 0) {
  firebase.default.initializeApp(firebaseConfig);
  firebase.default.firestore().settings({ experimentalForceLongPolling: true });
}

const db = firebase.default.firestore();
const chatsRef = db.collection("chats");

export default function App() {
  const [user, setUser] = useState<{ name: string; _id: string } | null>(null);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<
    {
      createdAt: string;
    }[]
  >([]);

  const readUser = async () => {
    const user = await AsyncStorage.getItem("user");
    if (user) setUser(JSON.parse(user));
  };

  const appendMessages = useCallback(
    (messages: any[]) => {
      setMessages((prev) => GiftedChat.append(prev, messages));
    },
    [messages]
  );

  const handlePress = async () => {
    const _id = Math.random().toString(36).substring(7);
    const user = { _id, name };
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const handleSend = async (messages: any[]) => {
    const writes = messages.map((m) => chatsRef.add(m));
    await Promise.all(writes);
  };

  useEffect(() => {
    readUser();

    const unSub = chatsRef.onSnapshot((querySnap) => {
      const firestoreMessages = querySnap
        .docChanges()
        .filter(({ type }) => type === "added")
        .map(({ doc }) => {
          const message = doc.data();
          return {
            ...message,
            createdAt: message.createdAt.toDate(),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      appendMessages(firestoreMessages);
    });

    return () => unSub();
  }, []);

  if (!user)
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name : "
          value={name}
          onChangeText={setName}
        />
        <Button title="Enter to Chat" onPress={handlePress} />
      </View>
    );

  return <GiftedChat {...{ user, messages }} onSend={handleSend} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    padding: 15,
    borderColor: "gray",
    marginBottom: 20,
  },
});
