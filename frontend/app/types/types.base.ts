export interface Organization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  organization: Organization;
}
