 // js/utils/storage.js
/**
 * Local Storage utilities
 */
const storage = {
    /**
     * Menyimpan data ke localStorage
     * @param {string} key - Key untuk penyimpanan
     * @param {any} value - Value yang akan disimpan
     */
    save(key, value) {
      try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    
    /**
     * Mengambil data dari localStorage
     * @param {string} key - Key yang akan diambil
     * @param {any} defaultValue - Default value jika key tidak ditemukan
     * @returns {any} - Data yang tersimpan atau default value
     */
    get(key, defaultValue = null) {
      try {
        const serializedValue = localStorage.getItem(key);
        if (serializedValue === null) {
          return defaultValue;
        }
        return JSON.parse(serializedValue);
      } catch (error) {
        console.error('Error getting from localStorage:', error);
        return defaultValue;
      }
    },
    
    /**
     * Menghapus data dari localStorage
     * @param {string} key - Key yang akan dihapus
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    },
    
    /**
     * Menghapus semua data dari localStorage
     */
    clear() {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };
  
  export default storage;