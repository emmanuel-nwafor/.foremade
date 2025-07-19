import React from 'react';

const AnimatedStepper = ({ steps, currentStep, className = '' }) => {
  const progressWidth = `${((currentStep + 1) / steps.length) * 100}%`;

  return (
    <div className={`w-full max-w-6xl mx-auto mb-6 ${className}`}>
      <div className="relative flex justify-between items-center">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-4">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
            style={{ width: progressWidth }}
          />
        </div>
        {steps.map((step, index) => (
          <div key={step} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                index <= currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              {index < currentStep ? (
                <i className="bx bx-check animate-fade-in"></i>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                index <= currentStep ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AnimatedStepper;