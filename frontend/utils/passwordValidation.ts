export interface PasswordRequirement {
  id: string;
  text: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'minLength',
    text: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    text: 'At least one uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    text: 'At least one lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    text: 'At least one number',
    test: (password: string) => /\d/.test(password),
  },
  {
    id: 'specialChar',
    text: 'At least one special character (!@#$%^&*)',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

export interface PasswordValidationResult {
  isValid: boolean;
  requirements: Array<{
    id: string;
    text: string;
    isMet: boolean;
  }>;
  score: number; // 0-100
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const requirements = PASSWORD_REQUIREMENTS.map(req => ({
    id: req.id,
    text: req.text,
    isMet: req.test(password),
  }));

  const metCount = requirements.filter(req => req.isMet).length;
  const score = Math.round((metCount / PASSWORD_REQUIREMENTS.length) * 100);
  const isValid = metCount === PASSWORD_REQUIREMENTS.length;

  return {
    isValid,
    requirements,
    score,
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  if (score >= 100) return 'Very Strong';
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score >= 100) return '#28A745'; // green
  if (score >= 80) return '#6CB04A'; // light green
  if (score >= 60) return '#FFC107'; // yellow
  if (score >= 40) return '#FD7E14'; // orange
  if (score >= 20) return '#DC3545'; // red
  return '#DC3545'; // red
};