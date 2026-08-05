import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

export default function ScannerScreen({ navigation }: any) {
  const { session } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleScan({ data }: { data: string }) {
    if (processando) return; // evita disparar a mesma leitura várias vezes
    setProcessando(true);
    setErro('');

    try {
      const resposta = await api('/auth/request', {
        method: 'POST',
        userId: session!.userId,
        body: { metodo: 'QRCODE', qrCodeToken: data },
      });
      navigation.replace('Autorizacao', { solicitacao: resposta });
    } catch (e: any) {
      setErro(e.message || 'QR Code inválido.');
      setProcessando(false);
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permText}>Precisamos da câmera pra ler o QR Code da empresa.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Permitir câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={processando ? undefined : handleScan}
      />

      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.instrucao}>
          {processando ? 'Enviando solicitação...' : 'Aponte pro QR Code da empresa'}
        </Text>
        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { color: theme.colors.text, fontSize: 15, textAlign: 'center', marginBottom: 20 },
  primaryButton: { backgroundColor: theme.colors.accent, borderRadius: 8, padding: 14, paddingHorizontal: 24 },
  primaryButtonText: { color: theme.colors.accentInk, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,21,27,0.25)',
  },
  frame: { width: 240, height: 240, borderWidth: 2, borderColor: theme.colors.accent, borderRadius: 16 },
  instrucao: { color: '#fff', fontSize: 14, marginTop: 20, backgroundColor: 'rgba(16,21,27,0.6)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  errorText: { color: '#ffb3ab', marginTop: 12, backgroundColor: 'rgba(193,85,75,0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, fontSize: 13 },
  closeButton: {
    position: 'absolute', top: 56, right: 24, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(16,21,27,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 16 },
});
