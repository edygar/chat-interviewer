import * as React from "react";
import { TextInput, View, Pressable } from "react-native";
import tw from "tailwind-react-native-classnames";
import SendIcon from "./SendIcon";

const Composer: React.FC<
  {
    onSend: (message: string) => void;
  } & React.ComponentProps<typeof TextInput>
> = ({ onSend, ...props }) => {
  const [text, setText] = React.useState("");
  const inputRef = React.useRef<TextInput>();

  return (
    <View
      style={tw`m-2 items-stretch rounded-lg border border-gray-900 items-end flex-row`}
    >
      <TextInput
        ref={inputRef}
        style={tw`flex-1 p-3`}
        value={text}
        onChangeText={(newText) => setText(newText)}
        onSubmitEditing={() => {
          if (text) {
            onSend(text);
          }
        }}
        {...props}
      />
      <Pressable onPress={() => text.trim() && onSend(text)}>
        <SendIcon
          style={[tw`h-6 w-6 mx-3 my-2`, !text.trim() && tw`opacity-30`]}
        />
      </Pressable>
    </View>
  );
};
export default Composer;
