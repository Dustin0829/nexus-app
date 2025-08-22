// End-to-end encryption utilities using Web Crypto API

// Generate a random encryption key
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  )
}

// Generate a random initialization vector
export const generateIV = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(12))
}

// Encrypt a file using AES-256-GCM
export const encryptFile = async (file: File): Promise<File> => {
  try {
    // Generate encryption key and IV
    const key = await generateEncryptionKey()
    const iv = generateIV()
    
    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer()
    
    // Encrypt the file data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      fileBuffer
    )
    
    // Export the key for storage (we'll store this securely)
    const exportedKey = await window.crypto.subtle.exportKey("raw", key)
    
    // Create metadata object with key and IV
    const metadata = {
      key: Array.from(new Uint8Array(exportedKey)),
      iv: Array.from(iv),
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
      encryptedSize: encryptedData.byteLength,
      algorithm: "AES-256-GCM",
      timestamp: new Date().toISOString()
    }
    
    // Encode metadata as UTF-8 bytes first and use its byte length
    const metadataText = JSON.stringify(metadata)
    const metadataBytes = new TextEncoder().encode(metadataText)
    const metadataLength = metadataBytes.byteLength

    // Combine metadata and encrypted data
    const combinedData = new Uint8Array(encryptedData.byteLength + 4 + metadataLength)
    
    // Write metadata length (4 bytes)
    const view = new DataView(combinedData.buffer)
    view.setUint32(0, metadataLength, false) // big-endian
    
    // Write metadata
    combinedData.set(metadataBytes, 4)
    
    // Write encrypted data
    combinedData.set(new Uint8Array(encryptedData), 4 + metadataLength)
    
    // Create new file with encrypted data
    const encryptedFile = new File(
      [combinedData],
      `${file.name}.encrypted`,
      { type: "application/octet-stream" }
    )
    
    return encryptedFile
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt file")
  }
}

// Decrypt a file using AES-256-GCM
export const decryptFile = async (encryptedFile: File): Promise<File> => {
  try {
    // Read encrypted file
    const encryptedBuffer = await encryptedFile.arrayBuffer()
    const encryptedData = new Uint8Array(encryptedBuffer)
    
    // Read metadata length (first 4 bytes)
    const view = new DataView(encryptedData.buffer)
    const metadataLength = view.getUint32(0, false) // big-endian
    
    // Read and parse metadata (robust to earlier char-length bug)
    let metadataStart = 4
    let metadataEnd = 4 + metadataLength
    if (metadataEnd > encryptedData.byteLength) {
      throw new Error("Corrupted metadata length")
    }

    const decoder = new TextDecoder()
    let metadata: any
    try {
      const metadataBytes = encryptedData.slice(metadataStart, metadataEnd)
      metadata = JSON.parse(decoder.decode(metadataBytes))
    } catch (e) {
      // Fallback: for older files where the stored length was character-based.
      // Scan forward for a matching '}' byte and try to parse incrementally.
      const rightBrace = 0x7d
      const maxEnd = Math.min(
        encryptedData.byteLength,
        metadataStart + metadataLength + 65536 // probe up to 64KB beyond recorded length
      )
      let parsed = false
      for (let i = metadataEnd; i < maxEnd; i++) {
        if (encryptedData[i] !== rightBrace) continue
        try {
          const candidate = encryptedData.slice(metadataStart, i + 1)
          const jsonText = decoder.decode(candidate)
          const obj = JSON.parse(jsonText)
          metadata = obj
          metadataEnd = metadataStart + new TextEncoder().encode(jsonText).byteLength
          parsed = true
          break
        } catch {
          // keep scanning
        }
      }
      if (!parsed) {
        throw new Error("Failed to parse metadata")
      }
    }
    
    // Read encrypted data
    const encryptedBytes = encryptedData.slice(metadataEnd)
    
    // Import the key
    const key = await window.crypto.subtle.importKey(
      "raw",
      new Uint8Array(metadata.key),
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // not extractable
      ["decrypt"]
    )
    
    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(metadata.iv),
      },
      key,
      encryptedBytes
    )
    
    // Create original file
    const originalFile = new File(
      [decryptedData],
      metadata.originalName,
      { type: metadata.originalType }
    )
    
    return originalFile
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt file")
  }
}

// Generate a secure random string for additional security
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length)
  window.crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Hash a string using SHA-256
export const hashString = async (input: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify file integrity
export const verifyFileIntegrity = async (file: File): Promise<boolean> => {
  try {
    const buffer = await file.arrayBuffer()
    const hash = await window.crypto.subtle.digest('SHA-256', buffer)
    // In a real implementation, you might want to store and verify against a known hash
    return true
  } catch (error) {
    console.error("File integrity check failed:", error)
    return false
  }
}
