import React, { ErrorInfo, ReactNode } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { AlertCircle, RefreshCcw } from "lucide-react-native";
import { PageContainer } from "./PageContainer";
import { logger } from "../utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("GlobalErrorBoundary caught an error:", { error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const theme = useTheme();

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorContainer }]}>
          <AlertCircle size={48} color={theme.colors.error} />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>
          Something went wrong
        </Text>
        
        <Text variant="bodyLarge" style={styles.subtitle}>
          The application encountered an unexpected error. We&apos;ve been notified and are looking into it.
        </Text>

        <View style={[styles.errorDetails, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            ERROR DETAILS
          </Text>
          <Text variant="bodySmall" style={styles.errorText}>
            {error?.message || "Unknown error"}
          </Text>
        </View>

        <Button
          mode="contained"
          icon={() => <RefreshCcw size={18} color="white" />}
          onPress={onReset}
          style={styles.button}
        >
          Try Again
        </Button>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  errorText: {
    fontFamily: "monospace",
    opacity: 0.8,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 6,
  },
});
