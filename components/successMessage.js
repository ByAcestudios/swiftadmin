import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

const SuccessMessage = ({ message, onClose, autoCloseDelay = 3000 }) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    const closeTimer = setTimeout(() => {
      if (typeof onClose === 'function') {
        onClose();
      }
    }, autoCloseDelay);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [autoCloseDelay, onClose]);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="text-green-500 w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-4">Success!</h2>
        <p className="text-center mb-4">{message}</p>
        {countdown > 0 && (
          <p className="text-center text-sm text-gray-500 mb-4">
            Closing in {countdown} seconds...
          </p>
        )}
        <div className="flex justify-center">
          <Button onClick={handleClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;