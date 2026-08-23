"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

export interface ShellPageHeader {
  description: string;
  title: string;
}

export const PageHeaderContext = createContext<Dispatch<
  SetStateAction<ShellPageHeader | null>
> | null>(null);

export function usePageHeaderSetter() {
  return useContext(PageHeaderContext);
}
