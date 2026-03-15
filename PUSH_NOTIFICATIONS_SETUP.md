# Push Notifications Setup

## Important: Project ID Configuration

The `app.json` file contains a placeholder `projectId` that needs to be replaced with your actual Expo project ID.

### Steps to get your Project ID:

1. Go to [expo.dev](https://expo.dev)
2. Sign in to your account
3. Create a new project or select an existing one
4. Copy the Project ID from your project settings
5. Replace `"your-project-id-here"` in `app.json` with your actual project ID

### Current Status

- ✅ Local notifications work in Expo Go
- ❌ Push notifications (remote tokens) require development build
- ✅ Proper error handling for Expo Go limitations
- ✅ Conditional logic to skip push token registration in Expo Go

### Development Build Required

For full push notification functionality, you need to create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure

# Create a development build
eas build --profile development --platform all
```

### Testing

- Local notifications should work immediately in Expo Go
- Push notifications require a physical device with development build
- Network errors for backend notifications are expected if backend is not running
