export interface ParameterDetail {
  id?: string;
  code: string;
  description?: string | null;
  ordering: number;
  active: boolean;
}

export interface SystemParameter {
  id: string;
  code: string;
  description?: string | null;
  active: boolean;
  details: ParameterDetail[];
}

export interface ParameterPayload {
  code: string;
  description?: string;
  active: boolean;
  details: ParameterDetail[];
}
