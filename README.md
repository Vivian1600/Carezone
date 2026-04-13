# CareZone

[![License: 0BSD](https://img.shields.io/badge/License-0BSD-blue.svg)](https://opensource.org/licenses/0BSD)
[![React Native](https://img.shields.io/badge/React%20Native-0.83.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~55.0.0-black.svg)](https://expo.dev/)

A comprehensive mobile application designed to streamline caregiving tasks, optimize routes, and facilitate communication between caregivers, care recipients, and families.

## 📋 Table of Contents

- [Features](#-features)
- [Technologies Used](#-technologies-used)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Usage](#-usage)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## ✨ Features

- **🔐 User Authentication**: Secure login and registration for caregivers, care recipients, and family members
- **📊 Role-Based Dashboards**: Customized interfaces for Caregivers, Care Recipients, and Families
- **✅ Task Management**: Track and complete caregiving tasks efficiently
- **🗺️ Route Optimization**: Plan and optimize visit routes for caregivers
- **🔔 Notifications**: Stay updated with important alerts and reminders
- **🌙 Dark Mode Support**: Toggle between light and dark themes for better usability
- **📋 Visit Details**: Detailed information about visits and interactions

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile development |
| **Expo** | Framework for building and deploying React Native apps |
| **React Navigation** | Navigation between screens |
| **AsyncStorage** | Local data storage |
| **React Native Paper** | UI components library |
| **Linear Gradient** | Visual enhancements |
| **Vector Icons** | Icon library for UI elements |

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 14 or higher)
- **Expo CLI**
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator)

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Vivian1600/Carezone.git
   cd Carezone
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm start
   ```

4. **Run on Device/Emulator**:
   - **Android**: `npm run android`
   - **iOS**: `npm run ios`
   - **Web**: `npm run web`

## 📁 Project Structure

```
Carezone/
├── 📄 App.js                 # Main app component
├── 📄 index.js               # Entry point
├── 📄 app.json               # Expo configuration
├── 📄 package.json           # Dependencies and scripts
├── 📄 config.js              # Configuration settings
├── 📁 assets/                # Static assets (images, icons)
├── 📁 CarezoneApp/           # Main app directory
│   ├── 📁 context/           # React contexts
│   │   ├── 🔐 AuthContext.js     # Authentication context
│   │   └── 🌙 DarkModeContext.js # Dark mode context
│   └── 📁 screens/           # App screens
│       ├── 👨‍⚕️ CaregiverDashboard.js
│       ├── 👴 CareRecipientDashboard.js
│       ├── 👨‍👩‍👧‍👦 FamilyDashboard.js
│       ├── 🏠 LandingScreen.js
│       ├── 🔑 LoginScreen.js
│       ├── 🔔 NotificationScreen.js
│       ├── 📝 RegisterScreen.js
│       ├── 🗺️ RouteOptimization.js
│       ├── 💫 SplashScreen.js
│       ├── ✅ TaskCompletion.js
│       └── 📋 VisitDetails.js
└── 📄 README.md              # This file
```

## 📖 Usage

1. **Launch the App**: Open the app on your device or emulator
2. **Create Account**: Register or log in with your account
3. **Navigate Dashboards**: Access role-specific interfaces based on your user type
4. **Manage Care**: Handle tasks, optimize routes, and view notifications

## 📸 Screenshots

*Screenshots will be added here once the app is fully developed.*

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Your Changes** and **Commit**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow React Native best practices
- Maintain consistent code style
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the **0BSD License** - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions, support, or collaboration opportunities:

- **Project Repository**: [GitHub](https://github.com/Vivian1600/Carezone)
- **Issues**: [Create an Issue](https://github.com/Vivian1600/Carezone/issues)

---

**Made with ❤️ for caregivers and families everywhere**

## Contact

For questions or support, please contact the development team.