# MediWallet - Medical Test Results Manager

A mobile application for managing and storing medical test results with local database storage.

## 🚀 Features

- **Scan New Tests**: Take photos or upload images of medical test results
- **Local Storage**: All data stored locally using SQLite + File System
- **View Test Results**: Browse all saved test results in a list
- **Test Details**: View detailed information for each test
- **Edit & Delete**: Update test information or remove old results
- **Dark Mode Support**: Automatic theme switching

## 📱 Installation & Setup

### Prerequisites
- Node.js (v18.19.1 or higher recommended)
- npm or yarn
- Expo CLI
- iOS Simulator, Android Emulator, or Expo Go app on your device

### Install Dependencies

```bash
cd /home/shurik/Projects/mediwallet
npm install
```

### Run the Application

```bash
# Start the development server
npm start

# Or run on specific platform
npm run android  # Run on Android
npm run ios      # Run on iOS (macOS only)
npm run web      # Run in web browser
```

## 🗄️ Database Structure

### SQLite Schema

```sql
CREATE TABLE test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  test_type TEXT NOT NULL,
  image_path TEXT NOT NULL,
  results TEXT,
  notes TEXT,
  analyzed_data TEXT
);
```

### File Storage

Images are stored in the device's document directory:
```
{DocumentDirectory}/medical_tests/test_TIMESTAMP.jpg
```

## 📂 Project Structure

```
mediwallet/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx           # Home screen with main actions
│   │   └── explore.tsx         # Explore tab
│   ├── test-results.tsx        # List of all test results
│   ├── test-detail/
│   │   └── [id].tsx            # Detailed view of a test result
│   └── _layout.tsx             # Root layout with DB initialization
├── components/                  # Reusable UI components
├── hooks/
│   └── use-database.ts         # Database initialization hook
├── services/
│   └── database.ts             # Database operations & file management
├── types/
│   └── test-result.ts          # TypeScript interfaces
└── constants/                  # Theme and constants

```

## 🔧 Key Components

### Database Service (`services/database.ts`)

Main functions:
- `initDatabase()` - Initialize SQLite database
- `saveImage(uri)` - Save image to permanent storage
- `addTestResult(data)` - Add new test result
- `getAllTestResults()` - Get all test results
- `getTestResultById(id)` - Get specific test result
- `updateTestResult(id, updates)` - Update test result
- `deleteTestResult(id)` - Delete test result and image
- `getDatabaseStats()` - Get database statistics

### Main Screens

#### Home Screen (`app/(tabs)/index.tsx`)
- Three main action buttons:
  1. **Access Test Results** - Navigate to list view
  2. **Scan New Test** - Take photo or choose from gallery
  3. **Analyze Health Status** - (Coming soon)

#### Test Results List (`app/test-results.tsx`)
- Shows all saved test results
- Pull to refresh
- Tap to view details

#### Test Detail View (`app/test-detail/[id].tsx`)
- View full-size image
- Edit test type and notes
- Delete test result

## 🔐 Permissions Required

The app requires the following permissions:

- **Camera**: To take photos of test results
- **Media Library**: To select existing photos

Permissions are requested automatically when needed.

## 📊 Data Flow

1. User takes photo or selects from gallery
2. Image is copied to permanent storage (`medical_tests/` directory)
3. Metadata is saved to SQLite database
4. User can view, edit, or delete test results
5. When deleting, both database record and image file are removed

## 🎨 Customization

### Theme Colors

Main colors are defined in the components:
- Primary: `#4A90E2` (Blue)
- Secondary: `#50C878` (Green)
- Accent: `#9B59B6` (Purple)

### Test Types

Default test type is "General Test". You can customize this in:
- `app/(tabs)/index.tsx` - `saveTestResult()` function

## 🚧 Future Enhancements

- [ ] OCR for text extraction from images
- [ ] Health status analysis based on test results
- [ ] Export data (PDF, CSV)
- [ ] Cloud backup and sync
- [ ] Test result trends and charts
- [ ] Reminders for periodic tests
- [ ] Multiple user profiles
- [ ] Search and filter functionality

## 🐛 Troubleshooting

### Database not initializing
- Check console logs for errors
- Delete app data and reinstall

### Images not showing
- Check file permissions
- Verify image path in database

### Build errors
- Run `npm install` again
- Clear cache: `npm start --clear`

## 📝 License

Private project

## 👨‍💻 Development

To add new features:

1. Update database schema in `services/database.ts` if needed
2. Add new types in `types/`
3. Create new screens in `app/`
4. Update navigation as needed

## 🔄 Database Migrations

If you need to modify the database structure:

1. Update the schema in `initDatabase()`
2. Create migration logic if needed
3. Consider data preservation for existing users

## 📱 Supported Platforms

- ✅ iOS (14.0+)
- ✅ Android (API 21+)
- ✅ Web (limited functionality)

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Database**: expo-sqlite
- **File System**: expo-file-system
- **Image Picker**: expo-image-picker
- **Language**: TypeScript

