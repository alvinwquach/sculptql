import { StylesConfig, GroupBase } from "react-select";
import { SelectOption } from "@/app/types/query";

export const selectStyles: StylesConfig<SelectOption, true> &
  StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: "#0f0f23",
    borderColor: state.isFocused ? "#8b5cf6" : "rgba(139, 92, 246, 0.3)",
    boxShadow: state.isFocused ? "0 0 15px rgba(139, 92, 246, 0.4)" : "0 0 5px rgba(139, 92, 246, 0.1)",
    "&:hover": { 
      borderColor: "#8b5cf6",
      boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)",
    },
    color: "#e0e6ed",
    borderRadius: "0.75rem",
    fontSize: "13px",
    minHeight: "36px",
    padding: "0.3rem",
    lineHeight: "1.4",
    width: "100%",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    transition: "all 0.2s ease-in-out",
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: "#e0e6ed",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  }),
  multiValue: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "rgba(244, 114, 182, 0.2)",
    border: "1px solid rgba(244, 114, 182, 0.4)",
    borderRadius: "0.5rem",
    margin: "0.1rem",
  }),
  multiValueLabel: (baseStyles) => ({
    ...baseStyles,
    color: "#f472b6",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    padding: "0.2rem 0.4rem",
  }),
  multiValueRemove: (baseStyles) => ({
    ...baseStyles,
    color: "#f472b6",
    borderRadius: "0.375rem",
    "&:hover": { 
      backgroundColor: "rgba(244, 114, 182, 0.3)", 
      color: "#fff",
      boxShadow: "0 0 8px rgba(244, 114, 182, 0.5)",
    },
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "#1e1b4b",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "0.75rem",
    marginTop: "0.3rem",
    zIndex: 9999,
    width: "100%",
    maxHeight: "300px",
    boxShadow: "0 0 25px rgba(139, 92, 246, 0.2)",
  }),
  menuList: (baseStyles) => ({
    ...baseStyles,
    maxHeight: "300px",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0.25rem",
    "::-webkit-scrollbar": {
      width: "8px",
    },
    "::-webkit-scrollbar-track": {
      background: "rgba(139, 92, 246, 0.1)",
      borderRadius: "0.5rem",
    },
    "::-webkit-scrollbar-thumb": {
      background: "rgba(139, 92, 246, 0.4)",
      borderRadius: "0.5rem",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: "rgba(139, 92, 246, 0.6)",
    },
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? "rgba(244, 114, 182, 0.3)"
      : state.isFocused
      ? "rgba(139, 92, 246, 0.1)"
      : "#1e1b4b",
    color: state.isSelected ? "#f472b6" : "#e0e6ed",
    "&:active": { backgroundColor: "rgba(244, 114, 182, 0.2)" },
    padding: "0.5rem 0.8rem",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    whiteSpace: "normal",
    wordBreak: "break-word",
    borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
    transition: "all 0.2s ease-in-out",
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: "rgba(224, 230, 237, 0.6)",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    color: "#e0e6ed",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "rgba(224, 230, 237, 0.6)",
    "&:hover": { 
      color: "#8b5cf6",
      transform: "scale(1.1)",
    },
    padding: "0.3rem",
    transition: "all 0.2s ease-in-out",
  }),
  clearIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "rgba(244, 114, 182, 0.6)",
    "&:hover": { 
      color: "#f472b6",
      transform: "scale(1.1)",
    },
    padding: "0.3rem",
    transition: "all 0.2s ease-in-out",
  }),
};
