# MediWallet 💊

Eine mobile Anwendung zur Verwaltung und Speicherung medizinischer Testergebnisse lokal auf Ihrem Gerät.

## 🚀 Schnellstart

1. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

2. **App starten**
   ```bash
   npm start
   ```

3. **Auf Ihrem Gerät ausführen**
   - QR-Code mit der Expo Go App scannen (iOS/Android)
   - `a` drücken für Android-Emulator
   - `i` drücken für iOS-Simulator
   - `w` drücken für Webbrowser

## ✨ Funktionen

- 📸 **Neue Tests scannen** - Fotos aufnehmen oder Bilder von medizinischen Tests hochladen
- 📂 **Testergebnisse aufrufen** - Alle gespeicherten Testergebnisse anzeigen
- 📊 **Gesundheitsstatus analysieren** - (In Kürze verfügbar)
- 🗄️ **Lokale Speicherung** - Alle Daten sicher auf Ihrem Gerät gespeichert (SQLite + Dateisystem)
- 🌓 **Dunkler Modus** - Automatisches Theme-Wechseln
- ✏️ **Bearbeiten & Löschen** - Ihre Testergebnisse verwalten

## 📱 Screenshots & Verwendung

### Hauptbildschirm
- **Testergebnisse aufrufen** - Alle gespeicherten Tests durchsuchen
- **Neuen Test scannen** - Neue Testergebnisse über Kamera oder Galerie hinzufügen
- **Gesundheitsstatus analysieren** - Gesundheitsinsights erhalten (in Kürze verfügbar)

### Testergebnisse-Liste
- Alle Testergebnisse mit Miniaturansichten anzeigen
- Zum Aktualisieren nach unten ziehen
- Auf ein Element tippen, um Details anzuzeigen

### Testdetails
- Vollständiges Bild anzeigen
- Testtyp und Notizen bearbeiten
- Testergebnis löschen

## 🗄️ Datenspeicherung

- **Datenbank**: SQLite für Metadaten (Testtyp, Datum, Notizen, etc.)
- **Dateien**: Bilder werden im Dokumentenverzeichnis des Geräts gespeichert
- **Datenschutz**: Alle Daten bleiben auf Ihrem Gerät

## 📋 Anforderungen

- Node.js 18.19.1 oder höher
- Expo CLI
- iOS Simulator, Android Emulator oder Expo Go App

## 📚 Dokumentation

Siehe [MEDIWALLET_GUIDE.md](./MEDIWALLET_GUIDE.md) für detaillierte Dokumentation.

## 🔧 Tech Stack

- React Native (Expo)
- TypeScript
- Expo Router (Navigation)
- expo-sqlite (Datenbank)
- expo-file-system (Dateispeicherung)
- expo-image-picker (Kamera/Galerie)

## 📝 Verfügbare Skripte

```bash
npm start          # Expo Dev-Server starten
npm run android    # Auf Android ausführen
npm run ios        # Auf iOS ausführen
npm run web        # Im Browser ausführen
npm run lint       # Linter ausführen
```

## 🛠️ Projektstruktur

```
mediwallet/
├── app/                    # Bildschirme und Navigation
│   ├── (tabs)/            # Tab-Navigation
│   ├── test-results.tsx   # Liste aller Tests
│   └── test-detail/       # Detailansicht
├── components/            # Wiederverwendbare UI-Komponenten
├── services/              # Datenbank- & Dateioperationen
├── types/                 # TypeScript-Typen
└── hooks/                 # Benutzerdefinierte React-Hooks
```

## 🔐 Berechtigungen

Die App wird anfordern:
- Kamera-Zugriff (zum Aufnehmen von Fotos)
- Medienbibliothek-Zugriff (zum Auswählen von Fotos)

## 🚧 In Kürze verfügbar

- OCR-Textextraktion
- Gesundheitsstatus-Analyse
- Export nach PDF
- Cloud-Backup
- Testergebnis-Trends

## 📄 Lizenz

Privates Projekt

---

Erstellt mit ❤️ mit Expo
