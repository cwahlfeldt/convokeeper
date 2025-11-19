/**
 * ZipExtractor Module
 *
 * Specialized for handling zip file extraction.
 * Uses JSZip to extract content from zip/dms files.
 */

import JSZip from 'jszip';

export class ZipExtractor {
  /**
   * Extract content from a zip file
   * @param {ArrayBuffer} data - ArrayBuffer containing zip data
   * @returns {Promise<Object>} - Promise resolving to JSZip object
   */
  async extractZip(data) {
    try {
      // Load the zip file
      const zip = new JSZip();
      return await zip.loadAsync(data);
    } catch (error) {
      console.error('Error extracting zip:', error);
      throw new Error('Failed to extract zip file content');
    }
  }
  
  /**
   * Extract a specific file from a zip object
   * @param {Object} zip - JSZip object
   * @param {string} filePath - Path to the file in the zip
   * @param {string} format - Format to extract as ('string', 'blob', etc.)
   * @returns {Promise<any>} - Promise resolving to the extracted file content
   */
  async extractFile(zip, filePath, format = 'string') {
    const file = zip.files[filePath];
    
    if (!file) {
      throw new Error(`File '${filePath}' not found in the archive`);
    }
    
    return await file.async(format);
  }
}
