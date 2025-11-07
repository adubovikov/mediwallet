# MediWallet 💊

A mobile application for managing and storing medical test results locally on your device.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npm start
   ```

3. **Run on your device**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser

## ✨ Features

- 📸 **Scan New Tests** - Take photos or upload images of medical tests
- 📂 **Access Test Results** - View all saved test results
- 📊 **Analyze Health Status** - (Coming soon)
- 🗄️ **Local Storage** - All data stored securely on your device (SQLite + File System)
- 🌓 **Dark Mode** - Automatic theme switching
- ✏️ **Edit & Delete** - Manage your test results

## 📱 Screenshots & Usage

### Main Screen
- **Access Test Results** - Browse all saved tests
- **Scan New Test** - Add new test results via camera or gallery
- **Analyze Health Status** - Get health insights (coming soon)

### Test Results List
- View all test results with thumbnails
- Pull to refresh
- Tap any item to view details

### Test Details
- View full-size image
- Edit test type and notes
- Delete test result

## 🗄️ Data Storage

- **Database**: SQLite for metadata (test type, date, notes, etc.)
- **Files**: Images stored in device's document directory
- **Privacy**: All data stays on your device

## 📋 Requirements

- Node.js 18.19.1 or higher
- Expo CLI
- iOS Simulator, Android Emulator, or Expo Go app

## 📚 Documentation

See [MEDIWALLET_GUIDE.md](./MEDIWALLET_GUIDE.md) for detailed documentation.

## 🔧 Tech Stack

- React Native (Expo)
- TypeScript
- Expo Router (navigation)
- expo-sqlite (database)
- expo-file-system (file storage)
- expo-image-picker (camera/gallery)

## 📝 Available Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
npm run lint       # Run linter
```

## 🛠️ Project Structure

```
mediwallet/
├── app/                    # Screens and navigation
│   ├── (tabs)/            # Tab navigation
│   ├── test-results.tsx   # List of all tests
│   └── test-detail/       # Detail view
├── components/            # Reusable UI components
├── services/              # Database & file operations
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

## 🔐 Permissions

The app will request:
- Camera access (for taking photos)
- Media library access (for selecting photos)

## 🚧 Coming Soon

- OCR text extraction
- Health status analysis
- Export to PDF
- Cloud backup
- Test result trends

## 📄 License

Private project

---

Made with ❤️ using Expo
