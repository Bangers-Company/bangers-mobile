import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">This is a modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text variant="bodyLarge" style={{ color: "#a60df2" }}>
          Go to home screen
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#040405",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
