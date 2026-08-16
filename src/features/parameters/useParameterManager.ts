"use client";

import type { ParameterDetail, SystemParameter } from "@/features/parameters/types";
import { useCallback, useState } from "react";

const emptyDetail = (): ParameterDetail => ({
  code: "",
  description: "",
  ordering: 0,
  active: true,
});

export function useParameterManager() {
  const [editing, setEditing] = useState<SystemParameter | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState<ParameterDetail[]>([emptyDetail()]);
  const [parameterActive, setParameterActive] = useState(true);

  const openForm = useCallback((parameter?: SystemParameter) => {
    setEditing(parameter ?? null);
    setParameterActive(parameter?.active ?? true);
    setDetails(
      parameter?.details.length
        ? [...parameter.details]
            .sort((a, b) => a.ordering - b.ordering)
            .map((item) => ({ ...item }))
        : [emptyDetail()],
    );
    setFormOpen(true);
  }, []);

  return {
    details,
    editing,
    formOpen,
    openForm,
    parameterActive,
    setDetails,
    setEditing,
    setFormOpen,
    setParameterActive,
  };
}
