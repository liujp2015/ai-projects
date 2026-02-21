'use client';

import { useState, useEffect } from 'react';
import { fetchDocuments, uploadDocument, uploadImages, createManualDocument, fetchReviewQueue, DocumentItem } from '@/lib/api';
import Link from 'next/link';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manual input state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docData, reviewData] = await Promise.all([
        fetchDocuments(),
        fetchReviewQueue().catch(() => []), // Handle error gracefully
      ]);
      setDocuments(docData);
      setReviewCount(reviewData.length);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await uploadDocument(file);
      await loadData();
    } catch (err) {
      setError('Upload failed. Please ensure backend is running at :3001');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      const title = prompt('Enter a title for this image group:', `Images ${new Date().toLocaleDateString()}`);
      await uploadImages(files, title || undefined);
      await loadData();
    } catch (err) {
      setError('Images upload & OCR failed. Please ensure backend is running at :3001');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) return;

    try {
      setSavingManual(true);
      setError(null);
      await createManualDocument(manualTitle || 'Untitled Text', manualContent);
      setManualTitle('');
      setManualContent('');
      setShowManualInput(false);
      await loadData();
    } catch (err) {
      setError('Failed to save manual content');
      console.error(err);
    } finally {
      setSavingManual(false);
    }
  };

  const testAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Audio system test. Browser text to speech is active.');
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      console.log('[TTS] Testing browser speech synthesis...');
    } else {
      alert('您的浏览器不支持 Web Speech API，请尝试使用 Chrome 或 Edge 浏览器。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">My Library</h1>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={testAudio}
                className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
                title="测试浏览器声音播放"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                测试声音
              </button>
              <Link 
                href="/conversations" 
                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                对话
              </Link>
              <Link 
                href="/user-words" 
                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                生词本
              </Link>
              <Link 
                href="/review" 
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                复习
                {reviewCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {reviewCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex-1 md:flex-none inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              {showManualInput ? 'Cancel' : 'Paste'}
            </button>
            <div className="flex-1 md:flex-none relative">
              <input
                type="file"
                id="images-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImagesUpload}
                disabled={uploading}
              />
              <label
                htmlFor="images-upload"
                className={`inline-flex w-full justify-center items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? '...' : 'Images'}
              </label>
            </div>
            <div className="flex-1 md:flex-none relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex w-full justify-center items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? '...' : 'File'}
              </label>
            </div>
          </div>
        </header>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="bg-white shadow sm:rounded-md p-6 mb-8">
            <h2 className="text-lg font-medium mb-4">Paste Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title (Optional)</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a title for this content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  required
                  rows={8}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste your English text here..."
                />
              </div>
              <button
                type="submit"
                disabled={savingManual}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
              >
                {savingManual ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No documents yet. Start by uploading one!</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Link href={`/documents/${doc.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">{doc.title}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {doc.mimeType === 'application/pdf' ? 'PDF' : 'Word'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {Math.round(doc.fileSize / 1024)} KB
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Uploaded on {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

