/**
 * FileReader Module
 * 
 * Specialized for handling file reading operations.
 * Provides methods to read files in different formats.
 */

export class FileReader {
  /**
   * Read a file as ArrayBuffer
   * @param {File} file - The file to read
   * @returns {Promise<ArrayBuffer>} - Promise resolving to an ArrayBuffer
   */
  readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();

      reader.onload = function (event) {
        resolve(event.target.result);
      };

      reader.onerror = function () {
        reject(new Error('Failed to read the file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Read a file as Text
   * @param {File} file - The file to read
   * @returns {Promise<string>} - Promise resolving to a string
   */
  readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();

      reader.onload = function (event) {
        resolve(event.target.result);
      };

      reader.onerror = function () {
        reject(new Error('Failed to read the file'));
      };

      reader.readAsText(file);
    });
  }
  
  /**
   * Read a file as DataURL
   * @param {File} file - The file to read
   * @returns {Promise<string>} - Promise resolving to a data URL
   */
  readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();

      reader.onload = function (event) {
        resolve(event.target.result);
      };

      reader.onerror = function () {
        reject(new Error('Failed to read the file'));
      };

      reader.readAsDataURL(file);
    });
  }
}
