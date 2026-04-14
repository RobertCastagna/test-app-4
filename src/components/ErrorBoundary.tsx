import { Component, type ReactNode } from "react";
import { Text, View } from "react-native";

import { logEvent } from "../services/telemetry";

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    void logEvent("error", "react_error_boundary", {
      message: error.message,
      stack: error.stack,
    });
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <View className="flex-1 items-center justify-center bg-bg px-6">
            <Text className="mb-2 text-lg font-semibold text-fg">
              Something went wrong
            </Text>
            <Text className="text-center text-sm text-fgDim">
              {this.state.error.message}
            </Text>
          </View>
        )
      );
    }
    return this.props.children;
  }
}
