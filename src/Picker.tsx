import * as React from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    overflow: "scroll"
  },
  choice: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "darkblue",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    margin: 5
  },
  choicePressed: {
    backgroundColor: "darkblue"
  },
  choiceText: {
    color: "darkblue"
  },
  choiceTextPressed: {
    color: "white"
  }
});

type Choice = { label: string; value: string };

const Picker: React.FC<{
  choices: Choice[];
  onPick: (choice: Choice) => void;
}> = ({ choices, onPick }) => {
  return (
    <View style={styles.container}>
      {choices.map((choice) => (
        <Pressable key={choice.label} onPress={() => onPick(choice)}>
          {({ pressed }) => (
            <View
              style={[styles.choice, pressed ? styles.choicePressed : null]}
            >
              <Text
                style={[styles.choiceText, pressed && styles.choiceTextPressed]}
              >
                {choice.label}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
};
export default Picker;
