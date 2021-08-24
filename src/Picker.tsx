import * as React from "react";
import { View, StyleSheet, Text, Pressable, FlatList } from "react-native";
import tw from "tailwind-react-native-classnames";

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
    <FlatList
      data={choices}
      keyExtractor={({ value }) => value}
      renderItem={({ item: choice }) => (
        <Pressable key={choice.label} onPress={() => onPick(choice)}>
          {({ pressed }) => (
            <View
              style={[
                tw`rounded-xl border border-blue-700 overflow-hidden items-center justify-center p-3 mx-3 my-1 self-end`,
                pressed ? tw`bg-blue-400 border-blue-400` : null
              ]}
            >
              <Text style={[tw`text-blue-700`, pressed && tw`text-white`]}>
                {choice.label}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    />
  );
};
export default Picker;
