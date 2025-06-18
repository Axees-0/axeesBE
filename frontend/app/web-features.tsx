import React from 'react';

interface WebFeaturesProps {
  children?: React.ReactNode;
}

// Web-specific features and polyfills for the demo
export function WebFeatures({ children }: WebFeaturesProps) {
  // In demo mode, we can add any web-specific features here
  // For now, this is just a passthrough component
  return <>{children}</>;
}