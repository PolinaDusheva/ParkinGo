import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../lib/colors';

interface Props {
  label: string;
  value?: string;           // text shown on the right (e.g. "Dark")
  onPress?: () => void;     // if provided: row is tappable, shows chevron
  rightElement?: React.ReactNode; // custom right side (e.g. Switch)
  destructive?: boolean;    // renders label in red
  isLast?: boolean;         // omit bottom separator line
}

export function SettingsRow({
  label,
  value,
  onPress,
  rightElement,
  destructive = false,
  isLast = false,
}: Props) {
  const { colorScheme } = useTheme();
  const C = COLORS[colorScheme];

  const content = (
    <View style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator }]}>
      <Text style={[styles.label, { color: destructive ? C.destructive : C.text }]}>
        {label}
      </Text>
      <View style={styles.right}>
        {rightElement ?? (
          <>
            {value ? <Text style={[styles.value, { color: C.textSecondary }]}>{value}</Text> : null}
            {onPress ? <Text style={[styles.chevron, { color: C.textSecondary }]}>›</Text> : null}
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
    marginLeft: 2,
  },
});
