import * as React from "react";

const emptySymbol = Symbol("emptyValue");
export function useLazyRef<T>(creator: () => T): React.MutableRefObject<T> {
  const valueRef = React.useRef<T | typeof emptySymbol>(emptySymbol);
  if (valueRef.current === emptySymbol) {
    valueRef.current = creator();
  }

  return valueRef as React.MutableRefObject<T>;
}
