import React, { useMemo } from "react";
import { View, FlatList } from "react-native";
import tw from "tailwind-react-native-classnames";
import Message from "./Message";
import LoadingIcon from "./LoadingIcon";

export const Thread = ({ logRegistry }) => {
  const chat = useMemo(() => [].concat(logRegistry.slice(0)).reverse(), [
    logRegistry
  ]);
  return (
    <View style={tw`flex-1 justify-end`}>
      <FlatList
        data={chat}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item: message }) => (
          <Chat.Entry avatar={<Chat.Avatar onTap={() => {}} />}>
            <Message onMenu={() => {}} timestamp={new Date()}>
              <Message.Text>Message</Message.Text>
            </Message>
            <Message onMenu={() => {}} timestamp={new Date()}>
              <Message.Text>Message</Message.Text>
            </Message>
            <Message onMenu={() => {}} timestamp={new Date()}>
              <LoadingIcon />
            </Message>
          </Chat.Entry>
        )}
      />
      {input ? <View style={tw`flex-none`}>{input}</View> : null}
    </View>
  );
};
