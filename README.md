# Nexus - Decentralized File Storage & Sharing

> **Privacy-focused, decentralized file storage and sharing web app built on Irys programmable datachain**

Nexus is an advanced file storage application that leverages the power of Irys, the world's first programmable datachain, to provide permanent, encrypted, and programmable file storage with complete user control.

## 🌟 Key Features

### 🔐 **Privacy & Security**
- **End-to-End Encryption**: All files are encrypted client-side using AES-256-GCM before upload
- **Zero-Knowledge Storage**: Only you can decrypt your files
- **Permanent Storage**: Files are stored permanently on the Irys blockchain

### 🚀 **Irys Integration**
- **Programmable Datachain**: Leverages Irys for composable data storage
- **Smart Contract Ready**: Files can be accessed and manipulated by smart contracts
- **Pay-as-you-go**: Only pay for the storage you actually use
- **No Subscriptions**: No monthly fees, just pay for uploads

### 💰 **Funding & Storage**
- **ETH Funding**: Fund your Irys wallet with ETH for storage
- **Real-time Balance**: See your current Irys balance
- **Cost Calculation**: Get real-time storage cost estimates
- **Balance Checks**: Automatic balance verification before uploads

### 📁 **File Management**
- **Drag & Drop Upload**: Easy file upload with progress tracking
- **Metadata Support**: Add descriptions, categories, and tags
- **Search & Filter**: Find files quickly with advanced search
- **File Sharing**: Generate shareable links via Irys gateway
- **Download & Decrypt**: Secure file download with automatic decryption

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Smooth Animations**: Professional user experience
- **Real-time Updates**: Live progress and status updates

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Web3**: Wagmi, ethers.js
- **Storage**: Irys SDK (@irys/sdk)
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Package Manager**: pnpm

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm
- MetaMask or other Ethereum wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexus-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_IRYS_NETWORK=mainnet
   NEXT_PUBLIC_IRYS_TOKEN=ethereum
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### 1. **Connect Your Wallet**
- Click "Connect Wallet" to open the wallet selection modal
- Choose from popular Ethereum wallets (MetaMask, WalletConnect, etc.)
- Your wallet will be used for Irys storage payments

### 2. **Fund Your Storage**
- Navigate to the "Funding" section
- Enter the amount of ETH you want to add to your Irys wallet
- Click "Fund Storage" to transfer ETH to Irys
- Minimum funding: 0.001 ETH

### 3. **Upload Files**
- Drag and drop files or click to select
- Add optional metadata (description, category, tags)
- Files are automatically encrypted before upload
- Real-time progress tracking during upload
- Files are permanently stored on Irys

### 4. **Manage Your Files**
- View all your uploaded files in the file list
- Search and filter files by name, description, or tags
- Download files (automatically decrypted)
- Share files via Irys gateway links
- Mark files for deletion (permanent storage)

## 🔧 Irys Integration Details

### **Programmable Features**
Nexus leverages Irys's programmable datachain capabilities:

- **Smart Contract Access**: Files can be accessed by smart contracts
- **Composable Data**: Data can be manipulated and evolved on-chain
- **Metadata Tags**: Rich metadata for future programmability
- **Access Control**: Built-in support for access control mechanisms

### **Storage Architecture**
```
User File → Client Encryption → Irys Upload → Permanent Storage
     ↓              ↓              ↓              ↓
  Original    AES-256-GCM    Programmable    Blockchain
   File       Encryption      Tags/Metadata   Storage
```

### **File Metadata Structure**
Each uploaded file includes programmable metadata:
```json
{
  "Content-Type": "application/pdf",
  "File-Name": "document.pdf",
  "File-Size": "1024000",
  "Upload-Date": "2024-01-01T00:00:00Z",
  "App": "Nexus",
  "Storage-Type": "permanent",
  "Programmable": "true",
  "Datachain": "Irys",
  "Description": "Optional file description",
  "Category": "Documents",
  "Access-Control": "public",
  "Royalties": "0"
}
```

## 🔐 Security Features

### **Encryption Process**
1. **Key Generation**: Random AES-256-GCM key and IV
2. **File Encryption**: Client-side encryption using Web Crypto API
3. **Key Embedding**: Encryption key and IV embedded in encrypted file
4. **Upload**: Only encrypted data sent to Irys
5. **Storage**: Encrypted file stored permanently on blockchain

### **Privacy Guarantees**
- **Zero Server Access**: No server can access your files
- **Client-Side Only**: All encryption/decryption happens in browser
- **No Key Storage**: Encryption keys never leave your device
- **Permanent Privacy**: Files remain encrypted forever

## 💡 Advanced Features

### **Programmable Data**
- **Smart Contract Integration**: Files can trigger smart contract actions
- **Access Control**: Future support for token-gated access
- **Royalties**: Built-in support for file access royalties
- **AI Integration**: Metadata ready for AI processing

### **Developer API**
- **RESTful Endpoints**: Programmatic file upload/download
- **Webhook Support**: Real-time notifications
- **SDK Integration**: Easy integration with existing apps

## 🌐 Network Configuration

### **Supported Networks**
- **Mainnet**: Production Irys network
- **Devnet**: Development and testing network

### **Token Support**
- **Ethereum (ETH)**: Primary funding token
- **Future**: USDC and other token support

## 🐛 Troubleshooting

### **Common Issues**

1. **Wallet Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Check if you're on the correct network
   - Try refreshing the page

2. **Upload Failures**
   - Check your Irys balance
   - Ensure sufficient ETH for gas fees
   - Verify file size limits

3. **Download Issues**
   - Check if the file transaction ID is valid
   - Ensure your wallet is connected
   - Try refreshing the file list

### **Error Messages**
- **"Insufficient Balance"**: Fund your Irys wallet with more ETH
- **"Upload Failed"**: Check network connection and try again
- **"Decryption Failed"**: File may be corrupted, try re-uploading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Irys Team**: For building the programmable datachain
- **Wagmi**: For excellent Web3 React hooks
- **shadcn/ui**: For beautiful UI components
- **Next.js Team**: For the amazing React framework

## 📞 Support

- **Discord**: Join our community for support
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the Irys docs for advanced usage

---

**Built with ❤️ on Irys programmable datachain**
