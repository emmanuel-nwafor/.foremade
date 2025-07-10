import React from 'react';
import YouthApplicationForm from '../components/youth/YouthApplicationForm';

const YouthEmpowermentForm = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <YouthApplicationForm />
      </div>
    </div>
  );
};

export default YouthEmpowermentForm;