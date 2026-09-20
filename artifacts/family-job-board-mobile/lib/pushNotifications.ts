import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_OPERATION_TIMEOUT_MS = 10_000;

function withTimeout<T>(operation: Promise<T>): Promise<T | null> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(
      () => resolve(null),
      NOTIFICATION_OPERATION_TIMEOUT_MS,
    );

    operation.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      () => {
        clearTimeout(timeoutId);
        resolve(null);
      },
    );
  });
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;

  const permissions = await withTimeout(Notifications.getPermissionsAsync());
  if (!permissions) return null;

  let status = permissions.status;
  if (status !== "granted") {
    const requested = await withTimeout(
      Notifications.requestPermissionsAsync(),
    );
    if (!requested) return null;

    status = requested.status;
  }
  if (status !== "granted") return null;

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  const token = await withTimeout(
    Notifications.getExpoPushTokenAsync({ projectId }),
  );
  return token?.data ?? null;
}