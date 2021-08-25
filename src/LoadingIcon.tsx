import * as React from "react";
import { View, ViewProps } from "react-native";
import tw from "tailwind-react-native-classnames";

const STEPS_COUNT = 6;

function getGradient(position, currentIndex, stepsCount = STEPS_COUNT) {
  if (position === currentIndex) return 50;
  if (position === (currentIndex + 1) % stepsCount) return 400;
  if (position === (currentIndex + stepsCount - 1) % stepsCount) return 400;
  return 500;
}

export default function LoadingIcon({ style, ...props }: ViewProps) {
  const [index, rotate] = React.useReducer(
    (index) => (index + 1) % STEPS_COUNT,
    0
  );
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
        style={[tw`bg-gray-${getGradient(0, index)}`, tw`rounded h-2 w-2`]}
      />
      <View
        style={[tw`bg-gray-${getGradient(1, index)}`, tw`rounded h-2 w-2 mx-1`]}
      />
      <View
        style={[tw`bg-gray-${getGradient(2, index)}`, tw`rounded h-2 w-2`]}
      />
    </View>
  );
}
