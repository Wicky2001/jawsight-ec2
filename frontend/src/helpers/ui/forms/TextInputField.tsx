import type { ChangeEventHandler, InputHTMLAttributes } from "react";
import FormField from "./FormField";

type TextInputFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  inputClassName?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

const TextInputField = ({
  label,
  required,
  error,
  helperText,
  inputClassName = "w-full themed-input input-focus py-2 px-3 rounded-lg text-sm",
  onChange,
  ...inputProps
}: TextInputFieldProps) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <input {...inputProps} onChange={onChange} className={inputClassName} />
    </FormField>
  );
};

export default TextInputField;
