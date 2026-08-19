import React, { useState } from "react";
import { View, StyleSheet, Pressable, Keyboard } from "react-native";
import { Text } from "react-native-paper";
import { Calendar as CalendarIcon } from "lucide-react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { getLocales } from "expo-localization";
import { useAppTheme } from "../../context/ThemeProvider";
import { addAlpha } from "../../utils/theme";

interface DatePickerFieldProps {
  value: string; // ISO format string YYYY-MM-DD or date string
  onChange: (isoDateString: string, dateObj: Date) => void;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select date",
  maxDate = new Date(),
  minDate = new Date(1920, 0, 1),
}) => {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);

  // Parse initial date value
  let selectedDate: Date | undefined = undefined;
  if (value) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      selectedDate = parsed;
    }
  }

  // Device country locale format
  const deviceLocale = getLocales()[0]?.languageTag || "en-US";
  const displayFormattedDate = selectedDate
    ? selectedDate.toLocaleDateString(deviceLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleOpen = () => {
    Keyboard.dismiss();
    setOpen(true);
  };

  const handleDismiss = () => {
    setOpen(false);
    Keyboard.dismiss();
  };

  const onConfirm = (params: { date: Date | undefined }) => {
    setOpen(false);
    Keyboard.dismiss();
    if (params.date) {
      const year = params.date.getFullYear();
      const month = String(params.date.getMonth() + 1).padStart(2, "0");
      const day = String(params.date.getDate()).padStart(2, "0");
      const isoString = `${year}-${month}-${day}`;
      onChange(isoString, params.date);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={handleOpen}
        style={[
          styles.inputRow,
          {
            backgroundColor: addAlpha(theme.colors.surface, 0.8),
            borderColor: addAlpha(theme.colors.outline, 0.18),
          },
        ]}
      >
        <CalendarIcon size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
        <Text
          style={[
            styles.inputText,
            {
              color: displayFormattedDate
                ? theme.colors.onSurface
                : addAlpha(theme.colors.onSurface, 0.45),
            },
          ]}
        >
          {displayFormattedDate || placeholder}
        </Text>
      </Pressable>

      <DatePickerModal
        locale={deviceLocale.split("-")[0] || "en"}
        mode="single"
        visible={open}
        onDismiss={handleDismiss}
        date={selectedDate || new Date(2000, 0, 1)}
        onConfirm={onConfirm}
        validRange={{
          startDate: minDate,
          endDate: maxDate,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
