import React, { useState } from 'react';
import ErrorNotification from './ErrorNotification';
import SuccessNotification from './SuccessNotification';

const NotificationTest: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showError = () => {
    setError('Invalid email or password. Please check your credentials and try again.');
  };

  const showSuccess = () => {
    setSuccess('Login successful! Welcome back.');
  };

  const showWarning = () => {
    setError('Your session will expire soon. Please save your work.');
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Notification Test</h2>
      
      <div className="space-x-4">
        <button
          onClick={showError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Show Error
        </button>
        
        <button
          onClick={showSuccess}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Success
        </button>
        
        <button
          onClick={showWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Show Warning
        </button>
      </div>

      {/* Error Notification */}
      <ErrorNotification
        error={error}
        onClose={() => setError(null)}
        autoClose={true}
        autoCloseDelay={5000}
        type="error"
      />

      {/* Success Notification */}
      <SuccessNotification
        message={success}
        onClose={() => setSuccess(null)}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default NotificationTest; 