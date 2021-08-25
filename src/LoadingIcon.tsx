import * as React from "react";
import { View, ViewProps } from "react-native";
import tw from "tailwind-react-native-classnames";

export function LoadingIcon({ style, ...props }: ViewProps) {
  const [index, rotate] = React.useReducer((index) => (index + 1) % 5, 0);
  const intervalRef = React.useRef(null);

  React.useEffect(() => {
    intervalRef.current = setInterval(rotate, 150);
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={[tw`m-1 flex-row`, style]}>
      <View
        style={[
          index === 0 ? tw`bg-white` : tw`bg-gray-500`,
          tw`rounded h-2 w-2`
        ]}
      />
      <View
        style={[
          index === 1 ? tw`bg-white` : tw`bg-gray-500`,
          tw`rounded h-2 w-2 mx-1`
        ]}
      />
      <View
        style={[
          index === 2 ? tw`bg-white` : tw`bg-gray-500`,
          tw`rounded h-2 w-2`
        ]}
      />
    </View>
  );
}
