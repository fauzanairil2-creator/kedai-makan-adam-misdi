# Kedai Makan Adam Misdi — Restaurant Order App

A simple Expo / React Native order-taking app for Android and iPhone. The app is designed for local demo use and saves its menu prices and orders on the device.

## Features

- Select from 12 tables
- Search the restaurant's menu
- Add items and adjust quantities
- Add kitchen notes (for example, less spicy or sambal on the side)
- Send orders to the in-app kitchen queue
- Update order status: Baru → Sedang dimasak → Siap
- Set and edit menu prices in RM by tapping a menu item's price
- Persist menu prices and orders on the device

## Run the app

Install Node.js, then in this directory run:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on a phone, or use the Expo development tools for Android/iOS simulators.

## Note about demo storage

This version uses local device storage only. Orders are not shared across phones/tablets, and uninstalling or clearing app data removes saved demo data. Set menu prices in the app before using totals; prices start at RM 0.00 because no prices were provided.
