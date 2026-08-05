import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

type Autorizacao = {
  empresa: string;
  categoria: string;
  dadosLiberados: string[];
  dataAutorizacao: string;
};

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

export default function HomeScreen({ navigation }: any) {
  const { session, sair } = useAuth();
  const [autorizacoes, setAutorizacoes] = useState<Autorizacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!session) return;
    setCarregando(true);
    try {
      const data = await api<Autorizacao[]>('/users/me/autorizacoes', { userId: session.userId });
      setAutorizacoes(data);
    } catch (e) {
      // silencioso — a tela mostra o estado vazio
    } finally {
      setCarregando(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.nome}>{session?.nomeCompleto}</Text>
        </View>
        <TouchableOpacity onPress={sair}>
          <Text style={styles.sairText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Nfc')}>
        <Text style={styles.scanButtonIcon}>)))</Text>
        <View>
          <Text style={styles.scanButtonTitle}>Aproximar NFC</Text>
          <Text style={styles.scanButtonSub}>Encoste o celular na etiqueta da empresa</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.scanButtonSecondary} onPress={() => navigation.navigate('Scanner')}>
        <Text style={styles.scanButtonIcon}>▢</Text>
        <View>
          <Text style={styles.scanButtonTitle}>Ler QR Code</Text>
          <Text style={styles.scanButtonSub}>Aponte a câmera pro QR da empresa</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Empresas autorizadas</Text>

      <FlatList
        data={autorizacoes}
        keyExtractor={(item, i) => item.empresa + i}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} tintColor={theme.colors.accent} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Você ainda não autorizou nenhuma empresa.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.empresaCard}>
            <Text style={styles.empresaNome}>{item.empresa}</Text>
            <Text style={styles.empresaData}>
              Autorizado em {new Date(item.dataAutorizacao).toLocaleDateString('pt-BR')}
            </Text>
            <View style={styles.tagsRow}>
              {item.dadosLiberados.map((campo) => (
                <View key={campo} style={styles.tag}>
                  <Text style={styles.tagText}>{LABEL_CAMPO[campo] || campo}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { color: theme.colors.textDim, fontSize: 14 },
  nome: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  sairText: { color: theme.colors.textDim, fontSize: 13 },
  scanButton: {
    backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.accent,
    borderRadius: theme.radius, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
  },
  scanButtonSecondary: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 32,
  },
  scanButtonIcon: { fontSize: 28, color: theme.colors.accent, marginRight: 14 },
  scanButtonTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  scanButtonSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginBottom: 14 },
  emptyText: { color: theme.colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 20 },
  empresaCard: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius, padding: 16, marginBottom: 12,
  },
  empresaNome: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  empresaData: { color: theme.colors.textDim, fontSize: 12, marginTop: 2, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(227,162,61,0.12)', borderWidth: 1, borderColor: theme.colors.accent, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { color: theme.colors.accent, fontSize: 11, fontWeight: '600' },
});
