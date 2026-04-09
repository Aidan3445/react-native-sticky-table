import React from "react";

export interface StickyTableTheme {
    background: string;
    foreground: string;
    foregroundSecondary?: string;
    border: string;
    muted: string;
}

export interface TableColumn<T = any> {
    id: string;
    label: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    width?: number; // Fixed width in pixels
    minWidth?: number; // Minimum width
    flex?: number; // Flex grow factor
    align?: "left" | "center" | "right";
    sticky?: "left" | "right"; // Sticky position
    sorter?: (a: T, b: T) => number; // Optional sorting function
}

export interface StickyColumnConfig {
    position: "left" | "right";
    columnId: string;
}
