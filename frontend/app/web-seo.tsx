import React from 'react';
import Head from 'expo-router/head';

interface WebSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function WebSEO({ 
  title = "Axees - Creator & Brand Partnership Platform",
  description = "Connect creators with brands for authentic partnerships. Discover opportunities, manage campaigns, and grow your influence on Axees.",
  keywords = "creator partnerships, brand deals, influencer marketing, content creation, social media",
  ogImage = "/og-image.png",
  canonical
}: WebSEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
}

// Default export required for Expo Router
export default WebSEO;