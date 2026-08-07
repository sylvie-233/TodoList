import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HEALTH_URL = 'http://192.168.1.48:3000/api/v1/health';

interface HealthResponse {
  status: string;
  data?: unknown;
  error?: string;
}

export default function HealthScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResponse | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(HEALTH_URL);
      const data = await response.json();
      setResult({
        status: `${response.status} ${response.statusText}`,
        data,
      });
    } catch (err) {
      setResult({
        status: 'Error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Health Check</ThemedText>
          <ThemedText style={styles.urlText} themeColor="textSecondary">
            {HEALTH_URL}
          </ThemedText>
        </ThemedView>

        <Pressable
          onPress={checkHealth}
          disabled={loading}
          style={({ pressed }) => [styles.checkButton, pressed && styles.pressed, loading && styles.checkButtonDisabled]}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.checkButtonText}>Send Request</ThemedText>
          )}
        </Pressable>

        {result && (
          <ThemedView type="backgroundElement" style={styles.resultCard}>
            <ThemedText type="smallBold" style={styles.resultTitle}>
              Response
            </ThemedText>
            <ThemedView style={styles.statusRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Status:{' '}
              </ThemedText>
              <ThemedText
                type="smallBold"
                themeColor={result.error ? 'text' : 'text'}>
                {result.status}
              </ThemedText>
            </ThemedView>
            {result.error ? (
              <ThemedView style={styles.errorBox}>
                <ThemedText type="code" style={{ color: '#EF4444' }}>
                  {result.error}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.dataBox}>
                <ThemedText type="code">
                  {JSON.stringify(result.data, null, 2)}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  urlText: {
    textAlign: 'center',
    fontSize: 13,
  },
  checkButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  checkButtonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  resultCard: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  resultTitle: {
    marginBottom: Spacing.one,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBox: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dataBox: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
