export const getFullMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Returns a media URL formatted for inline access.
 */
export const getInlineMediaUrl = (url?: string | null): string => {
  return getFullMediaUrl(url);
};

/**
 * Opens a PDF file in a new browser tab to view inline instead of opening a download window.
 */
export const openPdfInNewTab = async (url?: string | null) => {
  if (!url) return;
  const targetUrl = getInlineMediaUrl(url);

  // Open blank window immediately inside user click handler to avoid popup blockers
  const newTab = window.open('about:blank', '_blank');

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blobData = await response.blob();
    
    // Explicitly set MIME type to application/pdf so browser renders it inline
    const lowerUrl = url.toLowerCase();
    let mimeType = blobData.type;
    if (!mimeType || mimeType === 'application/octet-stream' || lowerUrl.includes('.pdf')) {
      mimeType = 'application/pdf';
    }

    const pdfBlob = new Blob([blobData], { type: mimeType });
    const blobUrl = URL.createObjectURL(pdfBlob);

    if (newTab) {
      newTab.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }
  } catch (err) {
    console.warn('Fallback to direct URL for PDF:', err);
    if (newTab) {
      newTab.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
  }
};

/**
 * Programmatically downloads a file ensuring proper extension (e.g. .pdf) and clean filename.
 */
export const downloadFile = async (
  url?: string | null,
  customFilename?: string,
  fileType?: string
) => {
  if (!url) return;
  const targetUrl = getFullMediaUrl(url);

  // Determine file extension
  let extension = '';
  const normType = fileType ? fileType.trim().toUpperCase() : '';
  const lowerUrl = url.toLowerCase();

  if (normType === 'PDF' || lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf')) {
    extension = '.pdf';
  } else if (normType === 'IMAGE' || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.webp')) {
    if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
      extension = '.jpg';
    } else if (lowerUrl.endsWith('.webp')) {
      extension = '.webp';
    } else {
      extension = '.png';
    }
  } else {
    // Default fallback to .pdf
    extension = '.pdf';
  }

  // Determine base filename
  let baseName = customFilename ? customFilename.trim() : '';
  if (!baseName) {
    baseName = url.split('/').pop()?.split('?')[0] || 'documento';
  }

  // Sanitize filename for operating system save dialog
  baseName = baseName.replace(/[/\\?%*:|"<>]/g, '_');

  // Ensure extension is appended if missing
  if (extension && !baseName.toLowerCase().endsWith(extension)) {
    baseName += extension;
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();

    // Re-create blob with explicit PDF or Image MIME type so OS save dialog handles it correctly
    const mimeType = extension === '.pdf' ? 'application/pdf' : (blob.type || 'application/octet-stream');
    const typedBlob = new Blob([blob], { type: mimeType });

    const blobUrl = URL.createObjectURL(typedBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = baseName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.warn('Fallback direct link download:', err);
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = baseName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};


