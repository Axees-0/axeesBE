export interface NameRequirement {
  id: string;
  text: string;
  test: (name: string) => boolean;
}

export const NAME_REQUIREMENTS: NameRequirement[] = [
  {
    id: 'minLength',
    text: 'At least 2 characters',
    test: (name: string) => name.trim().length >= 2,
  },
  {
    id: 'maxLength',
    text: 'No more than 50 characters',
    test: (name: string) => name.trim().length <= 50,
  },
  {
    id: 'validCharacters',
    text: 'Only letters, spaces, hyphens, and apostrophes',
    test: (name: string) => /^[a-zA-Z\s'-]+$/.test(name.trim()),
  },
  {
    id: 'noConsecutiveSpaces',
    text: 'No consecutive spaces',
    test: (name: string) => !/\s{2,}/.test(name),
  },
  {
    id: 'noLeadingTrailingSpaces',
    text: 'No leading or trailing spaces',
    test: (name: string) => name === name.trim(),
  },
];

export interface NameValidationResult {
  isValid: boolean;
  requirements: Array<{
    id: string;
    text: string;
    isMet: boolean;
  }>;
  errors: string[];
}

export const validateName = (name: string): NameValidationResult => {
  const requirements = NAME_REQUIREMENTS.map(req => ({
    id: req.id,
    text: req.text,
    isMet: req.test(name),
  }));

  const errors = requirements
    .filter(req => !req.isMet)
    .map(req => req.text);

  const isValid = requirements.every(req => req.isMet);

  return {
    isValid,
    requirements,
    errors,
  };
};

export const formatName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getNameSuggestions = (name: string): string[] => {
  const suggestions: string[] = [];
  
  // Remove extra spaces
  if (/\s{2,}/.test(name)) {
    suggestions.push(name.replace(/\s+/g, ' '));
  }
  
  // Remove leading/trailing spaces
  if (name !== name.trim()) {
    suggestions.push(name.trim());
  }
  
  // Format properly
  const formatted = formatName(name);
  if (formatted !== name && formatted.length >= 2) {
    suggestions.push(formatted);
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
};