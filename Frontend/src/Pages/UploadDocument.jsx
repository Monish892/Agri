import React, { useState } from 'react';
import API from '../Services/api';

const UploadDocuments = () => {
  const [documents, setDocuments] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filesArray = documents.split(',').map((doc) => doc.trim());

    try {
      await API.post('/users/verification-documents', { documents: filesArray });
      alert('Documents uploaded!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Enter document URLs (comma separated)"
        value={documents}
        onChange={(e) => setDocuments(e.target.value)}
      />
      <button type="submit">Upload</button>
    </form>
  );
};

export default UploadDocuments;
