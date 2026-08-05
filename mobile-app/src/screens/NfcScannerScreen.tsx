import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

type Estado = 'suportado' | 'nao-suportado' | 'verificando';

/**
 * Lê uma tag NFC gravada pela empresa (etiqueta física no balcão/recepção)
 * contendo, como texto NDEF, o MESMO token usado no QR Code da unidade
 * (qrCodeToken). Isso permite reaproveitar 100% da lógica que já existe
 * no backend para /auth/request — NFC e QR Code viram só duas formas
 * diferentes de entregar o mesmo token pro app.
 */
export default function NfcScannerScreen({ navigation }: any) {
  const { session } = useAuth();
  const [estado, setEstado] = useState<Estado>('verificando');
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const suportado = await NfcManager.isSupported();
        if (!ativo) return;
        if (suportado) {
          await NfcManager.start();
          setEstado('suportado');
          iniciarLeitura();
        } else {
          setEstado('nao-suportado');
        }
      } catch {
        setEstado('nao-suportado');
      }
    })();

    return () => {
      ativo = false;
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  async function iniciarLeitura() {
    setErro('');
    setLendo(true);
    try {
      // No Android, isso mantém o app "escutando" até uma tag ser aproximada.
      // No iOS, abre a folha de sistema padrão de leitura de NFC.
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      const token = extrairTokenDaTag(tag);
      if (!token) {
        throw new Error('Não conseguimos ler um token válido nessa tag.');
      }

      const resposta = await api('/auth/request', {
        method: 'POST',
        userId: session!.userId,
        body: { metodo: 'NFC', qrCodeToken: token },
      });

      navigation.replace('Autorizacao', { solicitacao: resposta });
    } catch (e: any) {
      setErro(e.message || 'Não foi possível ler a tag ou concluir a solicitação.');
    } finally {
      setLendo(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  }

  function extrairTokenDaTag(tag: any): string | null {
    try {
      const ndefRecord = tag?.ndefMessage?.[0];
      if (!ndefRecord) return null;
      // Registro NDEF do tipo texto (o formato mais comum pra gravar um id simples)
      const texto = Ndef.text.decodePayload(new Uint8Array(ndefRecord.payload));
      return texto?.trim() || null;
    } catch {
      return null;
    }
  }

  if (estado === 'verificando') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (estado === 'nao-suportado') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.icon}>—</Text>
        <Text style={styles.title}>Este aparelho não tem NFC</Text>
        <Text style={styles.sub}>Use a leitura por QR Code em vez disso.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('Scanner')}>
          <Text style={styles.primaryButtonText}>Ler QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centered]}>
      <View style={styles.pulseCircle}>
        <Text style={styles.icon}>))) </Text>
      </View>
      <Text style={styles.title}>{lendo ? 'Aproxime o celular' : 'Preparando leitura...'}</Text>
      <Text style={styles.sub}>
        {Platform.OS === 'ios'
          ? 'Encoste a parte de cima do iPhone na etiqueta da empresa.'
          : 'Encoste o celular na etiqueta NFC da empresa.'}
      </Text>

      {erro ? (
        <>
          <Text style={styles.errorText}>{erro}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={iniciarLeitura}>
            <Text style={styles.primaryButtonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </>
      ) : null}

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
        <Text style={styles.linkText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  pulseCircle: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  icon: { fontSize: 28, color: theme.colors.accent },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  sub: { color: theme.colors.textDim, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  primaryButton: { backgroundColor: theme.colors.accent, borderRadius: 8, padding: 14, paddingHorizontal: 28, marginTop: 8 },
  primaryButtonText: { color: theme.colors.accentInk, fontWeight: '700' },
  linkText: { color: theme.colors.textDim, fontSize: 13 },
  errorText: { color: '#ffb3ab', fontSize: 13, textAlign: 'center', marginBottom: 16, marginTop: 4 },
});
