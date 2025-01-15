import { ComponentType, memo, FunctionComponent } from "react";

export const typedMemo = <T extends ComponentType<any>>(
  Component: T,
  propsAreEqual?: (
    prevProps: Readonly<React.ComponentProps<T>>,
    nextProps: Readonly<React.ComponentProps<T>>
  ) => boolean
) => {
  return memo(
    Component as FunctionComponent<React.ComponentProps<T>>,
    propsAreEqual
  ) as unknown as T;
};
