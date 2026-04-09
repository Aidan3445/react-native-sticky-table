import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { OverscrollHeaderBehavior, StickyColumnConfig, StickyTableTheme, TableColumn } from "./StickyTable.types";

// Create AnimatedFlatList for native-driven scroll events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as any;

// Constants for consistent sizing
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 56;
const DEFAULT_COLUMN_WIDTH = 120;
const DEFAULT_FIXED_COLUMN_WIDTH = 150;

// Internal spacing constants (matching previous values)
const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export interface StickyTableProps<T> {
    items: T[];
    columns: TableColumn<T>[];
    theme: StickyTableTheme; // Required theme object
    stickyColumn?: StickyColumnConfig;
    loading?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    onItemPress?: (item: T) => void;
    onItemDelete?: (item: T) => void;
    emptyMessage?: string;
    emptyAction?: React.ReactNode;
    keyExtractor?: (item: T) => string;
    // Style overrides
    containerStyle?: ViewStyle;
    headerRowStyle?: ViewStyle;
    headerTextStyle?: TextStyle;
    rowStyle?: ViewStyle;
    cellTextStyle?: TextStyle;
    // Custom components
    TextComponent?: React.ComponentType<any>;
    // Overscroll behavior for headers
    overscrollBehavior?: OverscrollHeaderBehavior;
}

// Default key extractor (stable reference)
const defaultKeyExtractor = (item: any) => item.id;

export default function StickyTable<T>({
    items,
    columns,
    theme,
    stickyColumn,
    loading = false,
    refreshing = false,
    onRefresh,
    onLoadMore,
    hasMore = false,
    onItemPress,
    onItemDelete,
    emptyMessage = "No items found",
    emptyAction,
    keyExtractor = defaultKeyExtractor,
    containerStyle,
    headerRowStyle,
    headerTextStyle,
    rowStyle,
    cellTextStyle,
    TextComponent = Text,
    overscrollBehavior = "bounce",
}: StickyTableProps<T>) {
    // Safety check for theme
    const safeTheme = theme || {
        background: "#ffffff",
        foreground: "#000000",
        border: "#e5e5e5",
        muted: "#f5f5f5",
        foregroundSecondary: "#888888",
    };
    const { background, foreground, border, muted, foregroundSecondary } = safeTheme;

    // Animated scroll position for syncing fixed column vertically
    const scrollY = useRef(new Animated.Value(0)).current;

    // Derived animated value: extracts overscroll bounce offset (positive when scrollY < 0)
    const bounceOffset = useMemo(
        () =>
            scrollY.interpolate({
                inputRange: [-300, 0],
                outputRange: [300, 0],
                extrapolateLeft: "extend",
                extrapolateRight: "clamp",
            }),
        [scrollY],
    );

    // Counter-transform: cancels native bounce on the scrollable header (negative when scrollY < 0)
    const counterBounce = useMemo(
        () =>
            scrollY.interpolate({
                inputRange: [-300, 0],
                outputRange: [-300, 0],
                extrapolateLeft: "extend",
                extrapolateRight: "clamp",
            }),
        [scrollY],
    );

    // Sorting state
    const [direction, setDirection] = useState<"asc" | "desc" | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [tableData, setTableData] = useState<T[]>([]);

    useEffect(() => {
        // Deduplicate items by id to prevent duplicate key errors
        const seen = new Set<string>();
        const deduped = items.filter((item) => {
            const key = keyExtractor(item);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
        setTableData(deduped);
    }, [items, keyExtractor]);

    // Determine fixed and scrollable columns
    const fixedColumn = useMemo(() => {
        if (!stickyColumn) return null;
        return columns.find((col) => col.id === stickyColumn.columnId) || null;
    }, [columns, stickyColumn]);

    const scrollableColumns = useMemo(() => {
        if (!stickyColumn) return columns;
        return columns.filter((col) => col.id !== stickyColumn.columnId);
    }, [columns, stickyColumn]);

    const fixedColumnWidth = fixedColumn?.width ?? fixedColumn?.minWidth ?? DEFAULT_FIXED_COLUMN_WIDTH;

    // Calculate total width of scrollable columns for FlatList contentContainerStyle
    const scrollableContentWidth = useMemo(() => {
        return scrollableColumns.reduce((total, col) => {
            return total + (col.width ?? col.minWidth ?? DEFAULT_COLUMN_WIDTH);
        }, 0);
    }, [scrollableColumns]);

    // Sort table function
    const sortTable = useCallback(
        (column: TableColumn<T>) => {
            const newDirection = direction === "desc" ? "asc" : "desc";

            // Get the sort key
            let sortKey: string;
            if (typeof column.accessor === "function") {
                // Can't sort on function accessors easily, skip for now
                return;
            } else {
                sortKey = String(column.accessor);
            }

            // Simple Sort (replacing lodash)
            const sortedData = [...tableData].sort((a: any, b: any) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];

                if (aVal === bVal) return 0;

                const comparison = aVal > bVal ? 1 : -1;
                return newDirection === "asc" ? comparison : -comparison;
            });

            setSelectedColumn(column.id);
            setDirection(newDirection);
            setTableData(sortedData);
        },
        [direction, tableData],
    );

    // Arrow indicator for sort direction
    const renderSortArrow = useCallback(
        (columnId: string) => {
            if (selectedColumn !== columnId) return null;
            return (
                <TextComponent
                    style={{
                        color: foreground,
                        fontSize: 10,
                        marginLeft: 4,
                        transform: [{ rotate: direction === "desc" ? "180deg" : "0deg" }],
                    }}
                >
                    ^
                </TextComponent>
            );
        },
        [selectedColumn, direction, foreground, TextComponent],
    );

    // Memoized styles based on theme
    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: background,
                    borderRadius: spacing.xs,
                    overflow: "hidden",
                },
                // Scrollable header row
                headerRow: {
                    flexDirection: "row",
                    backgroundColor: muted,
                    borderBottomWidth: 2,
                    borderBottomColor: border,
                    height: HEADER_HEIGHT,
                },
                headerCell: {
                    paddingHorizontal: spacing.md,
                    justifyContent: "center",
                    height: HEADER_HEIGHT,
                    borderRightWidth: 1,
                    borderRightColor: border,
                },
                headerText: {
                    color: foreground,
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                // Scrollable data row
                dataRow: {
                    flexDirection: "row",
                    borderBottomWidth: 1,
                    borderBottomColor: border,
                    height: ROW_HEIGHT,
                },
                dataCell: {
                    paddingHorizontal: spacing.md,
                    justifyContent: "center",
                    height: ROW_HEIGHT,
                    borderRightWidth: 1,
                    borderRightColor: border,
                },
                cellText: {
                    color: foreground,
                    fontSize: 14,
                },
                // Fixed column overlay
                fixedColumnContainer: {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: background,
                    zIndex: 10,
                },
                fixedHeaderCell: {
                    backgroundColor: muted,
                    paddingHorizontal: spacing.md,
                    justifyContent: "center",
                    height: HEADER_HEIGHT,
                    borderBottomWidth: 2,
                    borderBottomColor: border,
                    borderRightWidth: 2,
                    borderRightColor: border,
                },
                fixedColumnBody: {
                    flex: 1,
                    overflow: "hidden",
                },
                fixedDataCell: {
                    paddingHorizontal: spacing.md,
                    justifyContent: "center",
                    height: ROW_HEIGHT,
                    borderBottomWidth: 1,
                    borderBottomColor: border,
                    backgroundColor: background,
                    borderRightWidth: 2,
                    borderRightColor: border,
                },
                // Empty and loading states
                emptyContainer: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: spacing.xxl,
                    gap: spacing.md,
                },
                emptyText: {
                    color: foregroundSecondary || foreground,
                    fontSize: 14,
                },
                loadingContainer: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: spacing.xxl,
                },
                footer: {
                    paddingVertical: spacing.lg,
                    alignItems: "center",
                },
            }),
        [background, foreground, border, muted, foregroundSecondary, spacing],
    );

    // Render scrollable header row
    const renderScrollableHeader = useCallback(() => {
        const header = (
            <View style={[styles.headerRow, headerRowStyle]}>
                {scrollableColumns.map((column) => {
                    const width = column.width ?? column.minWidth ?? DEFAULT_COLUMN_WIDTH;
                    return (
                        <TouchableOpacity key={column.id} style={[styles.headerCell, { width }]} onPress={() => sortTable(column)} activeOpacity={0.7}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <TextComponent
                                    style={[
                                        styles.headerText,
                                        headerTextStyle,
                                        column.align === "center" && { textAlign: "center" },
                                        column.align === "right" && { textAlign: "right" },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {column.label}
                                </TextComponent>
                                {renderSortArrow(column.id)}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );

        if (overscrollBehavior === "fixed") {
            return (
                <Animated.View style={{ transform: [{ translateY: counterBounce }] }}>
                    {header}
                </Animated.View>
            );
        }

        return header;
    }, [scrollableColumns, styles, sortTable, renderSortArrow, headerRowStyle, headerTextStyle, TextComponent, overscrollBehavior, counterBounce]);

    // Render scrollable data row
    const renderScrollableRow = useCallback(
        ({ item }: { item: T }) => {
            return (
                <TouchableOpacity style={[styles.dataRow, rowStyle]} onPress={() => onItemPress?.(item)} activeOpacity={onItemPress ? 0.7 : 1} disabled={!onItemPress}>
                    {scrollableColumns.map((column) => {
                        const width = column.width ?? column.minWidth ?? DEFAULT_COLUMN_WIDTH;

                        let content: React.ReactNode;
                        if (typeof column.accessor === "function") {
                            content = column.accessor(item);
                        } else {
                            const value = (item as any)[column.accessor];
                            content = (
                                <TextComponent
                                    style={[
                                        styles.cellText,
                                        cellTextStyle,
                                        column.align === "center" && { textAlign: "center" },
                                        column.align === "right" && { textAlign: "right" },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {String(value ?? "")}
                                </TextComponent>
                            );
                        }

                        return (
                            <View key={column.id} style={[styles.dataCell, { width }]}>
                                {content}
                            </View>
                        );
                    })}
                </TouchableOpacity>
            );
        },
        [scrollableColumns, styles, onItemPress, rowStyle, cellTextStyle, TextComponent],
    );

    // Render fixed header
    const renderFixedHeader = useCallback(() => {
        if (!fixedColumn) return null;

        return (
            <TouchableOpacity style={[styles.fixedHeaderCell, { width: fixedColumnWidth }]} onPress={() => sortTable(fixedColumn)} activeOpacity={0.7}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextComponent
                        style={[
                            styles.headerText,
                            headerTextStyle,
                            fixedColumn.align === "center" && { textAlign: "center" },
                            fixedColumn.align === "right" && { textAlign: "right" },
                        ]}
                        numberOfLines={1}
                    >
                        {fixedColumn.label}
                    </TextComponent>
                    {renderSortArrow(fixedColumn.id)}
                </View>
            </TouchableOpacity>
        );
    }, [fixedColumn, fixedColumnWidth, styles, sortTable, renderSortArrow, headerTextStyle, TextComponent]);

    // Render fixed cell content
    const renderFixedCellContent = useCallback(
        (item: T) => {
            if (!fixedColumn) return null;

            let content: React.ReactNode;
            if (typeof fixedColumn.accessor === "function") {
                content = fixedColumn.accessor(item);
            } else {
                const value = (item as any)[fixedColumn.accessor];
                content = (
                    <TextComponent
                        style={[styles.cellText, cellTextStyle, fixedColumn.align === "center" && { textAlign: "center" }, fixedColumn.align === "right" && { textAlign: "right" }]}
                        numberOfLines={2}
                    >
                        {String(value ?? "")}
                    </TextComponent>
                );
            }

            return content;
        },
        [fixedColumn, styles.cellText, cellTextStyle, TextComponent],
    );

    // Render empty state
    const renderEmpty = useCallback(() => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={foreground} />
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <TextComponent style={styles.emptyText}>{emptyMessage}</TextComponent>
                {emptyAction}
            </View>
        );
    }, [loading, foreground, emptyMessage, emptyAction, styles, TextComponent]);

    // Render footer (loading more indicator)
    const renderFooter = useCallback(() => {
        if (!hasMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={foreground} />
            </View>
        );
    }, [hasMore, foreground, styles.footer]);

    // Native-driven scroll handler for syncing fixed column
    const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });

    // Early return for initial loading with no data
    if (loading && tableData.length === 0) {
        return <View style={[styles.container, containerStyle]}>{renderEmpty()}</View>;
    }

    return (
        <View style={[styles.container, containerStyle]}>
            {/* Horizontal scroll wrapper for left/right scrolling */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                bounces={false}
                contentContainerStyle={{
                    paddingLeft: fixedColumn ? fixedColumnWidth : 0,
                    minWidth: scrollableContentWidth + (fixedColumn ? fixedColumnWidth : 0),
                }}
            >
                {/* Vertical FlatList with sticky header */}
                <AnimatedFlatList
                    data={tableData}
                    keyExtractor={(item: T, index: number) => `row-${keyExtractor(item)}-${index}`}
                    ListHeaderComponent={renderScrollableHeader}
                    stickyHeaderIndices={[0]}
                    renderItem={renderScrollableRow}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={hasMore ? onLoadMore : undefined}
                    onEndReachedThreshold={0.5}
                    refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={foreground} colors={[foreground]} /> : undefined}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={true} // Add this to ensure vertical scrolling is visible
                    style={{ width: scrollableContentWidth }}
                />
            </ScrollView>

            {/* Fixed Column Overlay */}
            {fixedColumn && (
                <View style={[styles.fixedColumnContainer, { width: fixedColumnWidth }]} pointerEvents="box-none">
                    {/* Fixed Header */}
                    {overscrollBehavior === "bounce" ? (
                        <Animated.View style={{ transform: [{ translateY: bounceOffset }] }}>
                            {renderFixedHeader()}
                        </Animated.View>
                    ) : (
                        renderFixedHeader()
                    )}

                    {/* Fixed Body Cells (scroll with content via translateY) */}
                    <View style={styles.fixedColumnBody}>
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        translateY: Animated.multiply(scrollY, -1),
                                    },
                                ],
                            }}
                        >
                            {tableData.map((item, index) => (
                                <TouchableOpacity
                                    key={`fixed-${keyExtractor(item)}-${index}`}
                                    style={[styles.fixedDataCell, { width: fixedColumnWidth }]}
                                    onPress={() => onItemPress?.(item)}
                                    activeOpacity={onItemPress ? 0.7 : 1}
                                    disabled={!onItemPress}
                                >
                                    {renderFixedCellContent(item)}
                                </TouchableOpacity>
                            ))}
                            {/* Footer spacer to match FlatList footer */}
                            {hasMore && <View style={{ height: 50 }} />}
                        </Animated.View>
                    </View>
                </View>
            )}
        </View>
    );
}
