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
  const { mine, avatar, ...otherProps } = props;
  const containerStyle = [styles.container, mine && styles.myContainer];
  let content;

  if ("children" in otherProps) {
    content = otherProps.children;
    delete otherProps.children;
  } else if ("content" in otherProps) {
    content = <Text style={styles.content}>{otherProps.content}</Text>;
    otherProps.content = undefined;
    delete otherProps.content;
  }

  if ("style" in otherProps) {
    containerStyle.push(otherProps.style);
    delete otherProps.style;
  }

  const avatarStyle = [styles.logo, mine && styles.myBg];
  return (
    <View style={containerStyle} {...otherProps}>
      {avatar ? (
        <Image style={avatarStyle} source={{ uri: avatar }} />
      ) : (
        <View style={avatarStyle}>
          <Text style={styles.logoText}>?</Text>
        </View>
      )}
      <View style={styles.spacer} />
      <View style={[styles.bubble, mine && [styles.myBubble, styles.myBg]]}>
        {content}
      </View>
    </View>
  );
};

Message.Text = ({ style, ...props }) => (
  <Text style={[].concat(styles.content, style)} {...props} />
);

const styles = StyleSheet.create({
  container: {
    margin: 5,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start"
  },
  spacer: {
    width: 5
  },
  content: {
    color: "white"
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#2c3e50",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center"
  },

  logoText: {
    fontSize: 16,
    color: "white"
  },

  bubble: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#34495e",
    minHeight: 40,
    maxWidth: "70%",
    justifyContent: "flex-start",
    padding: 15,
    borderRadius: 20,
    borderBottomLeftRadius: 0
  },
  myContainer: {
    flexDirection: "row-reverse"
  },
  myBubble: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 0
  },
  myBg: {
    backgroundColor: "#7f8c8d"
  }
});

export default Message;
