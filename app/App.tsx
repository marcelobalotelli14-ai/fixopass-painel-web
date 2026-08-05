import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { theme } from './src/theme/theme';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import { api } from './src/api/client';

import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import NfcScannerScreen from './src/screens/NfcScannerScreen';
import AutorizacaoScreen from './src/screens/AutorizacaoScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: true,
  colors: {
    primary: theme.colors.accent,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.accent,
  },
} as const;

function Rotas() {
  const { session, carregando } = useAuth();

  // Quando o usuário toca numa push notification (ex.: "Empresa X solicita
  // acesso"), busca os detalhes da solicitação e abre a tela de autorização
  // direto — sem isso, a notificação levaria só pra Home.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (resposta) => {
      const solicitacaoId = resposta.notification.request.content.data?.solicitacaoId as string | undefined;
      if (!solicitacaoId || !session) return;

      try {
        const solicitacao = await api(`/auth/request/${solicitacaoId}`, { userId: session.userId });
        navigate('Autorizacao', { solicitacao });
      } catch {
        // Se a solicitação já não existir mais (expirada/já resolvida em
        // outro dispositivo), simplesmente não navega — evita crash.
      }
    });

    return () => subscription.remove();
  }, [session]);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Nfc" component={NfcScannerScreen} options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="Autorizacao" component={AutorizacaoScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme as any}>
        <Rotas />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' },
});
