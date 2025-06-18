// components/ConfigurableCurrencyInput.tsx
import React, { useState, useCallback } from "react";
import CurrencyInput from "react-currency-input-field";
import { View, Text, StyleSheet } from "react-native";

interface ConfigurableCurrencyInputProps {
  label: string;
  value: string | undefined | null;
  onValueChange: (value: string | undefined) => void;
  minAmount?: number;
  maxAmount?: number;
  error?: boolean;
  errorMessage?: string;
  [key: string]: any;
}

const DEFAULT_MIN = 100;
const DEFAULT_MAX = 500000;
const DEFAULT_PREFIX = "$";

export const ConfigurableCurrencyInput: React.FC<ConfigurableCurrencyInputProps> = ({
  label,
  value,
  onValueChange,
  minAmount = DEFAULT_MIN,
  maxAmount = DEFAULT_MAX,
  error: externalError,
  errorMessage: externalErrorMessage,
  prefix = DEFAULT_PREFIX,
  decimalsLimit = 2,
  allowDecimals = true,
  style,
  ...rest
}) => {
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | null>(null);

  const handleValueChange = useCallback(
    (newValue: string | undefined, name?: string, values?: { float: number | null; formatted: string; value: string }) => {
      let currentInternalError: string | null = null;
      
      // First check if the input is completely invalid (like with Faker extension)
      if (newValue && isNaN(Number(newValue.replace(/[^0-9.-]/g, '')))) {
        currentInternalError = "Please enter a valid number";
        onValueChange(undefined); // Clear the invalid value
        setInternalErrorMessage(currentInternalError);
        return;
      }

      const floatValue = values?.float;

      if (floatValue !== null && floatValue !== undefined) {
        if (minAmount !== undefined && floatValue < minAmount) {
          currentInternalError = `Minimum amount is ${prefix}${minAmount.toLocaleString()}.`;
        } else if (maxAmount !== undefined && floatValue > maxAmount) {
          currentInternalError = `Maximum amount is ${prefix}${maxAmount.toLocaleString()}.`;
        }
      }
      
      setInternalErrorMessage(currentInternalError);
      onValueChange(newValue);
    },
    [minAmount, maxAmount, prefix, onValueChange]
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const currentValue = value;

      if (!currentValue || currentValue.trim() === "") {
        return;
      }

      // Additional sanitization for invalid inputs
      const sanitizedValue = currentValue.replace(/[^0-9.-]/g, '');
      if (isNaN(Number(sanitizedValue))) {
        onValueChange(undefined);
        return;
      }

      const prefixRegex = new RegExp(`[${prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}]`, "g");
      const cleanedValue = currentValue
        .replace(prefixRegex, "")
        .replace(/[,]/g, "");
      const numberValue = parseFloat(cleanedValue);

      if (!isNaN(numberValue)) {
        const formattedNumberString = numberValue.toFixed(2);
        if (cleanedValue !== formattedNumberString) {
          onValueChange(formattedNumberString);
        }
      } else {
        onValueChange(undefined);
      }

      if (rest.onBlur) {
        rest.onBlur(event);
      }
    },
    [value, onValueChange, prefix, rest.onBlur]
  );

  // Format the display value to prevent NaN from showing
  const formatDisplayValue = (val: string | undefined | null) => {
    if (!val) return "";
    
    // Check if the value is actually a valid number
    const numericValue = parseFloat(val.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) return "";

    return val;
  };

  const displayError = externalError || !!internalErrorMessage;
  const displayErrorMessage = internalErrorMessage || 
    externalErrorMessage || 
    `Amount must be between ${prefix}${minAmount.toLocaleString()} and ${prefix}${maxAmount.toLocaleString()}`;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <CurrencyInput
        value={formatDisplayValue(value)}
        onValueChange={handleValueChange}
        onBlur={handleBlur}
        prefix={prefix}
        decimalsLimit={decimalsLimit}
        allowDecimals={allowDecimals}
        style={{
          height: 58,
          borderWidth: 1,
          borderColor: displayError ? "red" : "#E2D0FB",
          borderRadius: 8,
          paddingLeft: 16,
          paddingRight: 16,
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          borderStyle: "solid",
          ...style,
        }}
        placeholder={rest.placeholder || `${prefix}0.00`}
        maxLength={rest.maxLength}
        intlConfig={rest.intlConfig}
        disabled={rest.disabled}
        {...rest}
      />
      {displayError && (
        <Text style={styles.errorText}>{displayErrorMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});