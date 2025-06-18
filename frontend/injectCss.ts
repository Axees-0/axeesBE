import { Platform } from "react-native";

const noGlow = `
textarea, select, input, button {
	-webkit-appearance: none;
	outline: none!important;
}
textarea:focus, select:focus, input:focus, button:focus {
	-webkit-appearance: none;
	outline: none!important;
}
`;

export const injectWebCss = () => {
  // Only on web
  if (Platform.OS !== "web") return;

  // Inject style
  const style = document.createElement("style");
  style.textContent = `textarea, select, input, button { outline: none!important; }`;

  const datePickerStyle = document.createElement("style");
  datePickerStyle.textContent = `
    .datepicker-popper {
      z-index: 99999 !important;
    }
    #datepicker-popper-container {
      z-index: 99999 !important;
    }
  `;

  const weekStyle = document.createElement("style");
  weekStyle.textContent = `
    .react-datepicker__week {
      z-index: 99999 !important;
      position: relative !important;
    }
  `;

  return document.head.append(style, datePickerStyle, weekStyle);
};
