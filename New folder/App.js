import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userResumes, setUserResumes] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Only PDF files are allowed!');
    }
  };

  const handleUpload = async () => {
    if (!name || !email || !file) {
      toast.error('Please fill in name, email, and select a file.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post(`http://localhost:5000/users/1/upload-resume`, formData);

      const uploadedResume = {
        name,
        email,
        file_path: res.data.filePath,
        uploaded_at: new Date().toLocaleString(),
      };

      setUserResumes([...userResumes, uploadedResume]);
      toast.success('Resume uploaded successfully');
      setName('');
      setEmail('');
      setFile(null);
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    }
    setUploading(false);
  };

  return (
    <div className="container mt-5">
      <ToastContainer />
      <h2 className="text-center mb-4">User Resume Upload</h2>

      <div className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input type="text" className="form-control" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
        </div>
        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input type="email" className="form-control" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
        </div>
        <div className="mb-3">
          <label className="form-label">Upload Resume (PDF only):</label>
          <input type="file" className="form-control" accept="application/pdf" onChange={handleFileChange} />
        </div>
        <button className="btn btn-primary w-100" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>

      <div className="mt-5">
        <h4>Uploaded Resumes</h4>
        <table className="table table-bordered table-hover mt-3">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Resume</th>
              <th>Uploaded At</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {userResumes.map((resume, index) => (
              <tr key={index}>
                <td>{resume.name}</td>
                <td>{resume.email}</td>
                <td>{resume.file_path.split('/').pop()}</td>
                <td>{resume.uploaded_at}</td>
                <td>
                  <a
                    href={`http://localhost:5000${resume.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-success"
                  >
                    Download
                  </a>
                </td>
              </tr>
            ))}
            {userResumes.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">No resumes uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
