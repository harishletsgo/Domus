'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Upload,
  Plus,
  Trash2,
  Calendar,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PropertyDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  walrusHash: string;
  walrusUrl: string;
  uploadedAt: string;
  description?: string;
}

interface PropertyDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

export function PropertyDocumentsModal({ 
  isOpen, 
  onClose, 
  propertyId, 
  propertyTitle 
}: PropertyDocumentsModalProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    if (isOpen && propertyId) {
      loadDocuments();
    }
  }, [isOpen, propertyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties/${propertyId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        throw new Error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load property documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Validate file types
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const invalidFiles = Array.from(files).filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        toast.error('Only PDF, JPG, and PNG files are allowed');
        event.target.value = '';
        return;
      }
      
      // Validate file sizes (max 10MB each)
      const oversizedFiles = Array.from(files).filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('File size must be less than 10MB');
        event.target.value = '';
        return;
      }
      
      setSelectedFiles(files);
    }
  };

  const uploadDocuments = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      
      Array.from(selectedFiles).forEach((file, index) => {
        formData.append(`documents`, file);
      });
      
      formData.append('propertyId', propertyId);
      formData.append('description', uploadDescription);

      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.uploadedCount} document(s) uploaded successfully!`);
        setSelectedFiles(null);
        setUploadDescription('');
        setShowUploadForm(false);
        await loadDocuments();
        
        // Reset file input
        const fileInput = document.getElementById('document-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (doc: PropertyDocument) => {
    try {
      const response = await fetch(doc.walrusUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const viewDocument = (doc: PropertyDocument) => {
    window.open(doc.walrusUrl, '_blank');
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        await loadDocuments();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else if (fileType.includes('image')) {
      return <Image className="w-6 h-6 text-green-500" />;
    }
    return <File className="w-6 h-6 text-gray-500" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Property Documents</h2>
                  <p className="text-gray-600 mt-1">{propertyTitle}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Documents
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
                {/* Upload Form */}
                {showUploadForm && (
                  <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Documents</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Files (PDF, JPG, PNG only)
                        </label>
                        <input
                          id="document-upload"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          placeholder="Add a description for these documents..."
                          className="form-textarea"
                          rows={2}
                        />
                      </div>

                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Selected {selectedFiles.length} file(s):
                          <ul className="mt-1 space-y-1">
                            {Array.from(selectedFiles).map((file, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{file.name}</span>
                                <span>{formatFileSize(file.size)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={uploadDocuments}
                          disabled={uploading || !selectedFiles || selectedFiles.length === 0}
                          className="btn-primary"
                        >
                          {uploading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Uploading...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Documents
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => setShowUploadForm(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents List */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-3 text-gray-600">Loading documents...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                      <p className="text-gray-600 mb-6">
                        This property doesn't have any documents uploaded yet.
                      </p>
                      <button
                        onClick={() => setShowUploadForm(true)}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Upload First Document
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Documents ({documents.length})
                      </h3>
                      
                      <div className="grid gap-4">
                        {documents.map((document) => (
                          <div
                            key={document.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {getFileIcon(document.fileType)}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {document.fileName}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{formatFileSize(document.fileSize)}</span>
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(document.uploadedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {document.description && (
                                    <p className="mt-2 text-sm text-gray-600">
                                      {document.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => viewDocument(document)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => downloadDocument(document)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Download Document"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteDocument(document.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
