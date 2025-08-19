import { StylesConfig, GroupBase } from "react-select";
import { SelectOption } from "@/app/types/query";

export const selectStyles: StylesConfig<SelectOption, true> &
  StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: "#1e293b",
    borderColor: state.isFocused ? "#3b82f6" : "#334155",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": { borderColor: "#3b82f6" },
    color: "#f8f9fa",
    borderRadius: "0.375rem",
    fontSize: "12px",
    minHeight: "28px",
    padding: "0.1rem",
    lineHeight: "1.25",
    width: "100%",
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: "#f8f9fa",
    fontSize: "12px",
  }),
  multiValue: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "#3b82f6",
    borderRadius: "0.25rem",
    margin: "0.05rem",
  }),
  multiValueLabel: (baseStyles) => ({
    ...baseStyles,
    color: "#f8f9fa",
    fontSize: "12px",
    padding: "0.1rem 0.2rem",
  }),
  multiValueRemove: (baseStyles) => ({
    ...baseStyles,
    color: "#f8f9fa",
    borderRadius: "0.25rem",
    "&:hover": { backgroundColor: "#2563eb", color: "#fff" },
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "0.375rem",
    marginTop: "0.1rem",
    zIndex: 20,
    width: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    wordWrap: "break-word",
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#334155"
      : "#1e293b",
    color: "#f8f9fa",
    "&:active": { backgroundColor: "#2563eb" },
    padding: "0.3rem 0.5rem",
    fontSize: "12px",
    whiteSpace: "normal",
    wordBreak: "break-word",
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: "#94a3b8",
    fontSize: "12px",
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    color: "#f8f9fa",
    fontSize: "12px",
  }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "#94a3b8",
    "&:hover": { color: "#3b82f6" },
    padding: "0.1rem",
  }),
  clearIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "#94a3b8",
    "&:hover": { color: "#3b82f6" },
    padding: "0.1rem",
  }),
};
