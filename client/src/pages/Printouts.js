import React, { useState, useEffect } from 'react';
import { printoutAPI } from '../services/api';
import './Printouts.css';

function Printouts() {
  const [tabs, setTabs] = useState('create');
  const [formData, setFormData] = useState({
    documentName: '',
    fileUrl: '',
    colorMode: 'BW',
    copies: 1,
    totalPages: 1
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPrintoutHistory();
  }, []);

  const fetchPrintoutHistory = async () => {
    try {
      const response = await printoutAPI.getPrintoutHistory();
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching printout history:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'copies' || name === 'totalPages' ? parseInt(value) : value
    }));
  };

  const calculateCost = () => {
    const pricePerPage = formData.colorMode === 'Color' ? 3 : 1;
    return pricePerPage * formData.totalPages * formData.copies;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await printoutAPI.createPrintout(formData);
      setSuccess('Printout request created! Proceed to payment.');
      
      setTimeout(() => {
        handlePayment(response.data.printout._id, calculateCost());
      }, 1500);

      setFormData({
        documentName: '',
        fileUrl: '',
        colorMode: 'BW',
        copies: 1,
        totalPages: 1
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create printout');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (printoutId, amount) => {
    const transactionId = 'TXN_' + Date.now();
    try {
      await printoutAPI.confirmPayment(printoutId, transactionId, 'gpay');
      setSuccess('Payment confirmed! Your printout is being processed.');
      fetchPrintoutHistory();
    } catch (error) {
      setError('Payment failed');
    }
  };

  const handleCancel = async (printoutId) => {
    if (window.confirm('Are you sure you want to cancel this printout?')) {
      try {
        await printoutAPI.cancelPrintout(printoutId);
        setSuccess('Printout cancelled successfully');
        fetchPrintoutHistory();
      } catch (error) {
        setError('Failed to cancel printout');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'processing':
        return 'status-processing';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'payment-completed';
      case 'pending':
        return 'payment-pending';
      case 'failed':
        return 'payment-failed';
      default:
        return '';
    }
  };

  return (
    <div className="printouts">
      <div className="container">
        <div className="printouts-header">
          <h1>🖨️ Printouts</h1>
          <p>Upload, print, and track your documents</p>
        </div>

        <div className="tab-navigation">
          <button
            className={`tab-btn ${tabs === 'create' ? 'active' : ''}`}
            onClick={() => setTabs('create')}
          >
            Create Printout
          </button>
          <button
            className={`tab-btn ${tabs === 'history' ? 'active' : ''}`}
            onClick={() => setTabs('history')}
          >
            Printout History
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tabs === 'create' && (
          <div className="create-printout-section">
            <div className="card">
              <h2>Create New Printout</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="documentName">Document Name</label>
                    <input
                      type="text"
                      id="documentName"
                      name="documentName"
                      value={formData.documentName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Chapter 5 Notes"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fileUrl">File URL</label>
                    <input
                      type="text"
                      id="fileUrl"
                      name="fileUrl"
                      value={formData.fileUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/file.pdf"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="totalPages">Total Pages</label>
                    <input
                      type="number"
                      id="totalPages"
                      name="totalPages"
                      value={formData.totalPages}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="copies">Number of Copies</label>
                    <input
                      type="number"
                      id="copies"
                      name="copies"
                      value={formData.copies}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="colorMode">Print Mode</label>
                    <select
                      id="colorMode"
                      name="colorMode"
                      value={formData.colorMode}
                      onChange={handleInputChange}
                    >
                      <option value="BW">Black & White (₹1/page)</option>
                      <option value="Color">Color (₹3/page)</option>
                    </select>
                  </div>
                </div>

                <div className="pricing-section">
                  <div className="pricing-item">
                    <span>Pages:</span>
                    <span>{formData.totalPages}</span>
                  </div>
                  <div className="pricing-item">
                    <span>Copies:</span>
                    <span>{formData.copies}</span>
                  </div>
                  <div className="pricing-item">
                    <span>Price per page:</span>
                    <span>₹{formData.colorMode === 'Color' ? '3' : '1'}</span>
                  </div>
                  <div className="pricing-item total">
                    <span>Total Cost:</span>
                    <span>₹{calculateCost()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </form>
            </div>

            <div className="info-section">
              <div className="info-card">
                <h3>💡 How it works</h3>
                <ol>
                  <li>Upload your document details</li>
                  <li>Choose print color (B&W or Color)</li>
                  <li>Select number of copies</li>
                  <li>Pay via GPay</li>
                  <li>Your printout will be ready</li>
                </ol>
              </div>

              <div className="info-card">
                <h3>💰 Pricing</h3>
                <ul>
                  <li><strong>Black & White:</strong> ₹1 per page</li>
                  <li><strong>Color:</strong> ₹3 per page</li>
                  <li><strong>Minimum:</strong> 1 page</li>
                  <li><strong>Maximum copies:</strong> 10</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tabs === 'history' && (
          <div className="printout-history-section">
            <div className="card">
              <h2>Your Printout History</h2>
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No printouts yet
                </p>
              ) : (
                <div className="history-table">
                  {history.map((printout) => (
                    <div key={printout._id} className="history-item">
                      <div className="item-header">
                        <div className="item-title">
                          <h4>{printout.documentName}</h4>
                          <span className={`status-badge ${getStatusColor(printout.status)}`}>
                            {printout.status}
                          </span>
                          <span className={`payment-badge ${getPaymentStatusColor(printout.paymentStatus)}`}>
                            Payment: {printout.paymentStatus}
                          </span>
                        </div>
                        <div className="item-cost">
                          ₹{printout.totalCost}
                        </div>
                      </div>

                      <div className="item-details">
                        <div className="detail">
                          <span className="label">Pages:</span>
                          <span className="value">{printout.totalPages}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Copies:</span>
                          <span className="value">{printout.copies}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Color Mode:</span>
                          <span className="value">{printout.colorMode === 'BW' ? 'Black & White' : 'Color'}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Created:</span>
                          <span className="value">{new Date(printout.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {printout.status !== 'completed' && printout.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(printout._id)}
                          className="btn btn-danger btn-small"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Printouts;
