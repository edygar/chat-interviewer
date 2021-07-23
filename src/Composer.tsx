import * as React from "react";
import {
  TextInput,
  View,
  ViewProps,
  StyleSheet,
  Pressable
} from "react-native";

const styles = StyleSheet.create({
  container: {
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#34495e",
    flexDirection: "row",
    alignItems: "flex-end"
  },
  input: {
    padding: 15,
    flex: 1
  },
  sendIconContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 5,
    marginBottom: 10,
    marginRight: 10,
    transform: [{ rotate: "45deg" }]
  },
  sendIcon: {
    borderColor: "transparent",
    borderBottomColor: "#2B4052",
    borderBottomWidth: 20,
    borderLeftWidth: 10,
    transform: [{ skewY: "-25deg" }]
  },
  sendIconRight: {
    transform: [{ scaleX: -1 }, { skewY: "-25deg" }]
  },
  sendDisabled: {
    opacity: 0.3
  }
});

const SendIcon: React.FC<Omit<ViewProps, "children">> = ({ style }) => {
  return (
    <View style={[styles.sendIconContainer, style]}>
      <View style={styles.sendIcon} />
      <View style={[styles.sendIcon, styles.sendIconRight]} />
    </View>
  );
};

const Composer: React.FC<
  {
    onSend: (message: string) => void;
  } & React.ComponentProps<typeof TextInput>
> = ({ onSend, ...props }) => {
  const [text, setText] = React.useState("");
  const inputRef = React.useRef<TextInput>();

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={(newText) => setText(newText)}
        onSubmitEditing={() => {
          if (text) {
            onSend(text);
          }
        }}
        {...props}
      />
      <Pressable onPress={() => text && onSend(text)}>
        <SendIcon style={!text && styles.sendDisabled} />
      </Pressable>
    </View>
  );
};
export default Composer;
