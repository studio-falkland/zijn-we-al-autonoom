// The map's search box.
//
// The visitor types a municipality or postcode, picks a suggestion, and the map
// flies there. Results come from PDOK through `usePlaceSearch`; the query is
// debounced with `useDebouncedValue` so we do not fire a request per keystroke.
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Circle, Line, Svg } from 'react-native-svg';

import { Input } from '@/components/input';
import { usePlaceSearch, type PlaceSuggestion } from '@/data/places';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Colors, Radii, Spacing, Type } from '@/theme/tokens';

// PDOK's result types, shown in the app's language.
const TYPE_LABELS: Record<string, string> = {
    gemeente: 'Municipality',
    woonplaats: 'Place',
    postcode: 'Postcode',
};

// How long to wait after the last keystroke before querying PDOK.
const DEBOUNCE_MS = 250;

// The search glyph (lucide's "search": a circle with a diagonal handle).
function SearchIcon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={8} stroke={Colors.blue[900]} strokeWidth={2} />
            <Line x1={21} y1={21} x2={16.65} y2={16.65} stroke={Colors.blue[900]} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

export function PostcodeSearch({ onSelect }: { onSelect: (place: PlaceSuggestion) => void }) {
    const [input, setInput] = useState('');
    const inputRef = useRef<TextInput>(null);

    // The debounced copy of `input` that actually drives the request.
    const query = useDebouncedValue(input, DEBOUNCE_MS);
    const { places } = usePlaceSearch(query);

    // Hand the chosen place to the screen, then clear and dismiss the box.
    const handleSelect = (place: PlaceSuggestion) => {
        onSelect(place);
        setInput('');
        inputRef.current?.blur();
    };

    // Only show the dropdown for a live query: the SWR cache keeps previous
    // results around briefly, so gating on the input closes it after a pick.
    const showSuggestions = input.trim().length > 0 && places.length > 0;

    return (
        <View style={styles.wrap}>
            <Input
                ref={inputRef}
                icon={<SearchIcon />}
                value={input}
                onChangeText={setInput}
                placeholder="Search for places or postcodes…"
                placeholderTextColor={Colors.blue.textbox}
                autoCorrect={false}
                returnKeyType="search"
            />
            {/* Suggestions open upward: the box sits at the bottom of the map. */}
            {showSuggestions && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={places}
                        keyExtractor={(place) => place.id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => handleSelect(item)}
                                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                            >
                                <Text style={styles.itemLabel} numberOfLines={1}>
                                    {item.label}
                                </Text>
                                <Text style={styles.itemType}>{TYPE_LABELS[item.type] ?? item.type}</Text>
                            </Pressable>
                        )}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'relative',
        zIndex: 10,
    },
    dropdown: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        bottom: '100%',
        left: 0,
        marginBottom: Spacing.xs,
        maxHeight: 280,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
    },
    item: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    itemPressed: {
        backgroundColor: Colors.blue[50],
    },
    itemLabel: {
        ...Type.body,
        color: Colors.blue[900],
        flex: 1,
    },
    itemType: {
        ...Type.bodySmall,
        color: Colors.blue.textbox,
    },
});
