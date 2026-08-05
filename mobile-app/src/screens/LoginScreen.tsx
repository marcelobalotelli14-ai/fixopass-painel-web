import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, getApiBase, setApiBase } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { registrarPushToken } from '../notifications/registerForPush';
import { theme } from '../theme/theme';

export default function LoginScreen({ navigation }: any) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [apiBase, setApiBaseInput] = useState('');
  const [mostrarConfig, setMostrarConfig] = useState(false);

  // BUG CORRIGIDO: setApiBase existia em src/api/client.ts mas nunca era
  // chamado em nenhuma tela — não tinha como testar em celular físico
  // sem editar o código-fonte e gerar um novo build. Agora dá pra trocar
  // o endereço direto na tela de login.
  useEffect(() => {
    getApiBase().then(setApiBaseInput);
  }, []);

  async function handleSalvarApiBase(valor: string) {
    setApiBaseInput(valor);
    await setApiBase(valor.trim());
  }

  async function handleLogin() {
    setErro('');
    setCarregando(true);
    try {
      const data = await api<{ userId: string; nomeCompleto: string }>('/users/login', {
        method: 'POST',
        body: { email, senha },
      });
      await entrar(data);
      registrarPushToken(data.userId); // não bloqueia a navegação — roda em segundo plano
    } catch (e: any) {
      setErro(e.message || 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>FP</Text>
        </View>
        <Text style={styles.brandName}>FIXO PASS</Text>
      </View>

      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subtitle}>Cadastre seus dados uma vez. Compartilhe em segundos quando precisar.</Text>

      {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="voce@email.com"
        placeholderTextColor={theme.colors.textDim}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••"
        placeholderTextColor={theme.colors.textDim}
        secureTextEntry
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={carregando}>
        <Text style={styles.primaryButtonText}>{carregando ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Ainda não tem conta? Cadastre-se</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMostrarConfig((v) => !v)} style={{ marginTop: 32 }}>
        <Text style={styles.configToggle}>{mostrarConfig ? 'Ocultar' : 'Servidor'} ⚙</Text>
      </TouchableOpacity>
      {mostrarConfig && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>Endereço da API</Text>
          <TextInput
            style={styles.input}
            value={apiBase}
            onChangeText={handleSalvarApiBase}
            placeholder="http://192.168.0.10:3000"
            placeholderTextColor={theme.colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandMark: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  brandMarkText: { color: theme.colors.accentInk, fontWeight: '700' },
  brandName: { color: theme.colors.text, fontSize: 17, fontWeight: '600' },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: theme.colors.textDim, fontSize: 14, marginBottom: 28 },
  label: { color: theme.colors.textDim, fontSize: 13, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: theme.colors.surface2, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 8, padding: 12, color: theme.colors.text, fontSize: 15,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28,
  },
  primaryButtonText: { color: theme.colors.accentInk, fontWeight: '700', fontSize: 15 },
  linkText: { color: theme.colors.accent, textAlign: 'center', fontSize: 13 },
  configToggle: { color: theme.colors.textDim, textAlign: 'center', fontSize: 12 },
  errorText: { color: '#ffb3ab', backgroundColor: 'rgba(193,85,75,0.12)', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
});
