/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from "react";
import {
  StyleSheet,
  Image,
  Text,
  TextProps,
  View,
  ViewProps
} from "react-native";
import tw from "tailwind-react-native-classnames";

type MessageProps = ViewProps & {
  avatar?: string;
  mine?: boolean;
} & (
    | { children: React.ReactNode[] }
    | {
        content: string | number;
      }
  );

type MessageModule = ((props: MessageProps) => React.ReactElement) & {
  Text: React.FC<TextProps>;
};

const Message: MessageModule = (props) => {
  const { mine, avatar, style, ...otherProps } = props;
  let content;

  if ("children" in otherProps) {
    content = otherProps.children;
    delete otherProps.children;
  } else if ("content" in otherProps) {
    content = <Message.Text>{otherProps.content}</Message.Text>;
    otherProps.content = undefined;
    delete otherProps.content;
  }

  const avatarStyle = [
    tw`w-10 h-10 bg-gray-600 rounded-full justify-center items-center`,
    mine ? tw`bg-blue-400 ml-2` : tw`mr-2`
  ];
  return (
    <View
      style={[
        tw`m-2 flex-row items-end justify-start`,
        mine && tw`flex-row-reverse`,
        style
      ]}
      {...otherProps}
    >
      {avatar ? (
        <Image style={avatarStyle} source={{ uri: avatar }} />
      ) : (
        <View style={avatarStyle}>
          <Text style={tw`text-sm text-white`}>?</Text>
        </View>
      )}
      <View
        style={[
          tw.style("flex-row flex-wrap justify-start p-3 rounded-xl", {
            maxWidth: "75%"
          }),
          mine
            ? tw` rounded-br-none bg-blue-400`
            : tw`rounded-bl-none bg-gray-600`
        ]}
      >
        {content}
      </View>
    </View>
  );
};

Message.Text = ({ style, ...props }) => (
  <Text style={[].concat(tw`text-white`, style)} {...props} />
);

export default Message;
