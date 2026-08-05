import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { api } from '../api/client';
import { theme } from '../theme/theme';

export default function CadastroScreen({ navigation }: any) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    setErro('');
    setCarregando(true);
    try {
      await api('/users', {
        method: 'POST',
        body: { nomeCompleto, telefone, email, cpf, endereco, senha },
      });
      navigation.replace('Login');
    } catch (e: any) {
      setErro(e.message || 'Não foi possível cadastrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Seus dados ficam guardados aqui — você decide quem recebe o quê.</Text>

      {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

      <Campo label="Nome completo" value={nomeCompleto} onChangeText={setNomeCompleto} />
      <Campo label="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Campo label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Campo label="CPF" value={cpf} onChangeText={setCpf} keyboardType="numeric" />
      <Campo label="Endereço (opcional)" value={endereco} onChangeText={setEndereco} />
      <Campo label="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

      <TouchableOpacity style={styles.primaryButton} onPress={handleCadastro} disabled={carregando}>
        <Text style={styles.primaryButtonText}>{carregando ? 'Criando...' : 'Criar conta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20, marginBottom: 40 }}>
        <Text style={styles.linkText}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Campo({ label, ...inputProps }: any) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.colors.textDim}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: theme.colors.textDim, fontSize: 14, marginBottom: 24 },
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
  errorText: { color: '#ffb3ab', backgroundColor: 'rgba(193,85,75,0.12)', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
});
