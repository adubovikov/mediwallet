# Инструкция по сборке приложения для iOS/Android

## Предварительные требования

### Для Android:
- Node.js 18.19.1 или выше
- Аккаунт Expo (бесплатный)
- Android Studio (для локальной сборки, опционально)

### Для iOS:
- Node.js 18.19.1 или выше
- Аккаунт Expo (бесплатный)
- macOS с Xcode (для локальной сборки, опционально)
- Apple Developer аккаунт ($99/год) - для публикации в App Store

## Способ 1: EAS Build (Рекомендуется)

EAS Build - это облачный сервис Expo для сборки приложений. Это самый простой способ.

### 1. Установка EAS CLI

```bash
npm install -g eas-cli
```

### 2. Вход в аккаунт Expo

```bash
eas login
```

Если у вас нет аккаунта, создайте его на [expo.dev](https://expo.dev)

### 3. Инициализация проекта

```bash
cd /home/shurik/Projects/mediwallet
eas build:configure
```

Это создаст файл `eas.json` с конфигурацией сборки.

### 4. Сборка для Android

```bash
# Production сборка (APK)
eas build --platform android --profile production

# Или для AAB (для Google Play Store)
eas build --platform android --profile production --type app-bundle
```

### 5. Сборка для iOS

```bash
# Production сборка
eas build --platform ios --profile production
```

**Важно для iOS:**
- При первой сборке вам нужно будет настроить Apple Developer аккаунт
- EAS CLI поможет вам пройти через процесс настройки сертификатов

### 6. Проверка статуса сборки

```bash
eas build:list
```

### 7. Скачивание готового приложения

После завершения сборки вы получите ссылку для скачивания. Или используйте:

```bash
eas build:list
# Затем скачайте нужную сборку по ID
```

## Способ 2: Локальная сборка

### Для Android (локально)

1. Установите Android Studio и настройте Android SDK
2. Создайте нативный проект:

```bash
npx expo prebuild
```

3. Соберите APK:

```bash
cd android
./gradlew assembleRelease
```

APK будет в `android/app/build/outputs/apk/release/`

### Для iOS (локально, только на macOS)

1. Установите Xcode из App Store
2. Создайте нативный проект:

```bash
npx expo prebuild
```

3. Откройте проект в Xcode:

```bash
open ios/medikit.xcworkspace
```

4. В Xcode:
   - Выберите устройство или симулятор
   - Product → Archive
   - Следуйте инструкциям для загрузки в App Store или экспорта

## Конфигурация app.json

Убедитесь, что в `app.json` указаны правильные настройки:

- `name` - название приложения
- `slug` - уникальный идентификатор
- `version` - версия приложения
- `ios.bundleIdentifier` - для iOS (добавьте если нужно)
- `android.package` - для Android (добавьте если нужно)

## Публикация в магазины

### Google Play Store

1. Соберите AAB файл:
```bash
eas build --platform android --profile production --type app-bundle
```

2. Загрузите AAB в Google Play Console
3. Заполните информацию о приложении
4. Отправьте на проверку

### Apple App Store

1. Соберите приложение:
```bash
eas build --platform ios --profile production
```

2. Используйте EAS Submit для автоматической загрузки:
```bash
eas submit --platform ios
```

Или загрузите вручную через Xcode или Transporter

## Полезные команды

```bash
# Просмотр всех сборок
eas build:list

# Просмотр конкретной сборки
eas build:view [BUILD_ID]

# Отмена сборки
eas build:cancel [BUILD_ID]

# Обновление OTA (Over-The-Air)
eas update --branch production

# Публикация в магазины
eas submit --platform android
eas submit --platform ios
```

## Профили сборки

В файле `eas.json` можно настроить разные профили:

- `development` - для разработки
- `preview` - для тестирования
- `production` - для продакшена

## Решение проблем

### Ошибки при сборке
- Проверьте логи: `eas build:view [BUILD_ID]`
- Убедитесь, что все зависимости установлены: `npm install`
- Очистите кеш: `npm start --clear`

### Проблемы с сертификатами iOS
- Используйте `eas credentials` для управления сертификатами
- EAS может автоматически создать и обновить сертификаты

### Проблемы с подписью Android
- EAS автоматически управляет ключами подписи
- Для production используйте managed workflow

## Дополнительные ресурсы

- [Документация EAS Build](https://docs.expo.dev/build/introduction/)
- [Руководство по публикации](https://docs.expo.dev/submit/introduction/)
- [Expo Discord](https://chat.expo.dev/) - для помощи

