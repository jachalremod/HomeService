"use client";

export function AutoSubmitTextInput({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onBlur={(e) => e.currentTarget.form?.requestSubmit()}
      className={className}
    />
  );
}

export function AutoSubmitRoleSelect({
  defaultValue,
  className,
}: {
  defaultValue: string;
  className?: string;
}) {
  return (
    <select
      name="role"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={className}
    >
      <option value="admin">Admin</option>
      <option value="office">Office</option>
      <option value="field">Field</option>
    </select>
  );
}