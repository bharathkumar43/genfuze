import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (response: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onSuccess, 
  onError, 
  disabled = false 
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Identity Services
    const loadGoogleScript = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).google) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      });
    };

    const initializeGoogleSignIn = async () => {
      try {
        await loadGoogleScript();
        
        if (!buttonRef.current) return;

        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID || '',
          callback: (response: any) => {
            if (response.error) {
              onError(response.error);
            } else {
              onSuccess(response);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        (window as any).google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 400,
        });

      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
        onError('Failed to load Google Sign-In');
      }
    };

    initializeGoogleSignIn();
  }, [onSuccess, onError]);

  return (
    <div 
      ref={buttonRef} 
      className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    />
  );
};

export default GoogleSignInButton; 