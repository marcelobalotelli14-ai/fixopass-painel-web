import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pede permissão de notificação, obtém o Expo Push Token deste dispositivo
 * e salva no backend (PUT /users/me/push-token). Chamar logo após o login.
 * Falha silenciosamente em emulador/simulador (push só funciona em
 * dispositivo físico).
 */
export async function registrarPushToken(userId: string) {
  try {
    if (!Device.isDevice) {
      console.log('Push notification requer dispositivo físico — pulando em emulador/simulador.');
      return;
    }

    const { status: statusAtual } = await Notifications.getPermissionsAsync();
    let status = statusAtual;
    if (status !== 'granted') {
      const resposta = await Notifications.requestPermissionsAsync();
      status = resposta.status;
    }
    if (status !== 'granted') {
      console.log('Permissão de notificação negada.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const expoPushToken = tokenResponse.data;

    await api('/users/me/push-token', {
      method: 'PUT',
      userId,
      body: { expoPushToken },
    });
  } catch (err) {
    // Nunca deixa a falta de push quebrar o login/uso do app.
    console.log('Não foi possível registrar push notification:', err);
  }
}
