import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function CounterScreen() {
  const [count, setCount] = useState(0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle">Counter Demo</ThemedText>

          <ThemedView type="backgroundElement" style={styles.counterCard}>
            <ThemedText type="title" style={styles.countText}>
              {count}
            </ThemedText>

            <ThemedView style={styles.buttonRow}>
              <Pressable
                onPress={() => setCount((c) => c - 1)}
                style={({ pressed }) => [styles.button, styles.decrementButton, pressed && styles.pressed]}>
                <ThemedText type="subtitle" style={styles.buttonText}>
                  -
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setCount((c) => c + 1)}
                style={({ pressed }) => [styles.button, styles.incrementButton, pressed && styles.pressed]}>
                <ThemedText type="subtitle" style={styles.buttonText}>
                  +
                </ThemedText>
              </Pressable>
            </ThemedView>

            <Pressable
              onPress={() => setCount(0)}
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
              <ThemedText type="small">Reset</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  counterCard: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.five,
    borderRadius: Spacing.four,
  },
  countText: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: Platform.select({ android: '700' }) ?? '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    backgroundColor: '#EF4444',
  },
  incrementButton: {
    backgroundColor: '#22C55E',
  },
  buttonText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
  resetButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#6B7280',
  },
});
