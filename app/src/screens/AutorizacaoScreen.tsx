import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const LABEL_CAMPO: Record<string, string> = {
  NOME: 'Nome',
  TELEFONE: 'Telefone',
  EMAIL: 'E-mail',
  CPF: 'CPF',
  RG: 'RG',
  DATA_NASCIMENTO: 'Data de nascimento',
  ENDERECO: 'Endereço',
  FOTO: 'Foto',
};

export default function AutorizacaoScreen({ route, navigation }: any) {
  const { session } = useAuth();
  const { solicitacao } = route.params;
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<'APROVADA' | 'NEGADA' | null>(null);
  const [erro, setErro] = useState('');

  async function responder(aprovar: boolean) {
    setProcessando(true);
    setErro('');
    try {
      await api('/customer/share', {
        method: 'POST',
        userId: session!.userId,
        body: { solicitacaoId: solicitacao.solicitacaoId, aprovar },
      });
      setResultado(aprovar ? 'APROVADA' : 'NEGADA');
    } catch (e: any) {
      // BUG CORRIGIDO: antes, uma falha aqui não mostrava nada — o usuário
      // tocava em "Aceitar" e a tela simplesmente voltava ao normal sem
      // nenhuma explicação do que aconteceu.
      setErro(e.message || 'Não foi possível concluir. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  if (resultado) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.resultIcon}>{resultado === 'APROVADA' ? '✓' : '✕'}</Text>
        <Text style={styles.resultTitle}>
          {resultado === 'APROVADA' ? 'Dados compartilhados' : 'Solicitação recusada'}
        </Text>
        <Text style={styles.resultSub}>
          {resultado === 'APROVADA'
            ? `${solicitacao.empresa} recebeu os dados liberados.`
            : 'Nenhum dado foi enviado.'}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.primaryButtonText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={styles.eyebrow}>SOLICITAÇÃO DE ACESSO</Text>
      <Text style={styles.empresaNome}>{solicitacao.empresa}</Text>
      <Text style={styles.mensagem}>{solicitacao.mensagem}</Text>

      <Text style={styles.sectionTitle}>Dados que serão enviados</Text>
      <View style={styles.camposBox}>
        {(solicitacao.camposPedidos || []).map((campo: string) => (
          <View key={campo} style={styles.campoRow}>
            <Text style={styles.campoNome}>{LABEL_CAMPO[campo] || campo}</Text>
            <Text style={styles.campoCheck}>✓</Text>
          </View>
        ))}
      </View>

      <Text style={styles.aviso}>
        Você pode revogar esse acesso a qualquer momento na tela "Empresas autorizadas".
      </Text>

      {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

      <TouchableOpacity style={styles.primaryButton} onPress={() => responder(true)} disabled={processando}>
        <Text style={styles.primaryButtonText}>{processando ? 'Enviando...' : 'Aceitar e compartilhar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.denyButton} onPress={() => responder(false)} disabled={processando}>
        <Text style={styles.denyButtonText}>Recusar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  eyebrow: { color: theme.colors.textDim, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  empresaNome: { color: theme.colors.text, fontSize: 26, fontWeight: '700', marginTop: 6, marginBottom: 10 },
  mensagem: { color: theme.colors.textDim, fontSize: 14, marginBottom: 28 },
  sectionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  camposBox: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius, paddingHorizontal: 16, marginBottom: 20,
  },
  campoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  campoNome: { color: theme.colors.text, fontSize: 14 },
  campoCheck: { color: theme.colors.accent, fontSize: 15, fontWeight: '700' },
  aviso: { color: theme.colors.textDim, fontSize: 12, marginBottom: 28, lineHeight: 18 },
  primaryButton: { backgroundColor: theme.colors.accent, borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: theme.colors.accentInk, fontWeight: '700', fontSize: 15 },
  denyButton: { borderWidth: 1, borderColor: theme.colors.deny, borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 40 },
  denyButtonText: { color: theme.colors.deny, fontWeight: '600', fontSize: 15 },
  resultIcon: { fontSize: 48, color: theme.colors.accent, marginBottom: 16 },
  resultTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  resultSub: { color: theme.colors.textDim, fontSize: 14, textAlign: 'center', marginBottom: 32 },
  errorText: { color: '#ffb3ab', backgroundColor: 'rgba(193,85,75,0.12)', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13, textAlign: 'center' },
});
