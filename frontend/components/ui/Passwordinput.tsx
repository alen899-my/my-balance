"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormInput, FormInputProps } from "./Forminput";

export type PasswordInputProps = Omit<FormInputProps, "type" | "rightElement">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [show, setShow] = useState(false);

    return (
      <FormInput
        {...props}
        ref={ref}
        type={show ? "text" : "password"}
        rightElement={
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((v) => !v)}
            className="text-muted-foreground hover:text-primary transition-colors duration-150"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        }
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";