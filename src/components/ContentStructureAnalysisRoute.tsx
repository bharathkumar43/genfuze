import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ContentStructureAnalysis } from './ContentStructureAnalysis';

export function ContentStructureAnalysisRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get content and URL from navigation state
  const { content = '', url = '' } = location.state || {};

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <ContentStructureAnalysis 
      content={content} 
      url={url} 
      onBack={handleBack} 
    />
  );
} 