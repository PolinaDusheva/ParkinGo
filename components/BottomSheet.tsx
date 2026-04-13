import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLLAPSED_HEIGHT = 72;

interface Props {
  children?: React.ReactNode;
  expanded?: boolean;
}

export function BottomSheet({ children, expanded }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(300)).current;
  const [sheetHeight, setSheetHeight] = useState(300);

  useEffect(() => {
    const toValue = expanded ? 0 : sheetHeight - COLLAPSED_HEIGHT;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [expanded, sheetHeight, translateY]);

  return (
    <Animated.View
      style={[styles.sheet, { paddingBottom: insets.bottom + 8, transform: [{ translateY }] }]}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h === sheetHeight) return;
        setSheetHeight(h);
        // Snap without animation so first render is correct
        if (!expanded) translateY.setValue(h - COLLAPSED_HEIGHT);
      }}
    >
      <View style={styles.handle} />
      {children ?? (
        <Text style={styles.hint}>Tap a parking spot to see details</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingBottom: 12,
  },
});
