# CareZone

A comprehensive mobile application designed to streamline caregiving tasks, optimize routes, and facilitate communication between caregivers, care recipients, and families.

## Features

- **User Authentication**: Secure login and registration for caregivers, care recipients, and family members.
- **Role-Based Dashboards**: Customized interfaces for Caregivers, Care Recipients, and Families.
- **Task Management**: Track and complete caregiving tasks efficiently.
- **Route Optimization**: Plan and optimize visit routes for caregivers.
- **Notifications**: Stay updated with important alerts and reminders.
- **Dark Mode Support**: Toggle between light and dark themes for better usability.
- **Visit Details**: Detailed information about visits and interactions.

## Technologies Used

- **React Native**: Cross-platform mobile development.
- **Expo**: Framework for building and deploying React Native apps.
- **React Navigation**: Navigation between screens.
- **AsyncStorage**: Local data storage.
- **React Native Paper**: UI components.
- **Linear Gradient**: For visual enhancements.
- **Vector Icons**: Icon library for UI elements.

## Installation

1. **Prerequisites**:
   - Node.js (version 14 or higher)
   - Expo CLI
   - Android Studio (for Android emulator) or Xcode (for iOS simulator)

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/Vivian1600/Carezone.git
   cd Carezone
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   ```bash
   npm start
   ```

5. **Run on Device/Emulator**:
   - For Android: `npm run android`
   - For iOS: `npm run ios`
   - For Web: `npm run web`

## Project Structure

```
Carezone/
├── App.js                 # Main app component
├── index.js               # Entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── config.js              # Configuration settings
├── assets/                # Static assets (images, icons)
├── CarezoneApp/           # Main app directory
│   ├── context/           # React contexts
│   │   ├── AuthContext.js     # Authentication context
│   │   └── DarkModeContext.js # Dark mode context
│   └── screens/           # App screens
│       ├── CaregiverDashboard.js
│       ├── CareRecipientDashboard.js
│       ├── FamilyDashboard.js
│       ├── LandingScreen.js
│       ├── LoginScreen.js
│       ├── NotificationScreen.js
│       ├── RegisterScreen.js
│       ├── RouteOptimization.js
│       ├── SplashScreen.js
│       ├── TaskCompletion.js
│       └── VisitDetails.js
└── README.md              # This file
```

## Usage

1. Launch the app on your device or emulator.
2. Register or log in with your account.
3. Navigate through the dashboards based on your role.
4. Manage tasks, optimize routes, and view notifications.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request.

## License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please contact the development team.