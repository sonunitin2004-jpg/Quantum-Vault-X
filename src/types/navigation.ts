export type AppPage =
  | 'signin'
  | 'signup'
  | 'neural-setup'
  | 'neural-login'
  | 'biometric-setup'
  | 'biometric-login'
  | 'dashboard';

export type NavigateFn = (page: AppPage) => void;

