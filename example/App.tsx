import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StickyTableTheme, StickyTableView, TableColumn } from "react-native-sticky-table";
// 1. Define your data type
interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive";
    lastLogin: string;
}
// 2. Create mock data
const MOCK_DATA: UserData[] = Array.from({ length: 50 }).map((_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? "Admin" : i % 3 === 1 ? "Editor" : "Viewer",
    status: i % 4 === 0 ? "inactive" : "active",
    lastLogin: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
}));
// 3. Define the theme
const theme: StickyTableTheme = {
    background: "#ffffff",
    foreground: "#111827",
    foregroundSecondary: "#6b7280",
    border: "#e5e7eb",
    muted: "#f3f4f6",
};
export default function App() {
    // 4. Define columns
    const columns: TableColumn<UserData>[] = [
        {
            id: "name",
            label: "Name",
            accessor: "name",
            width: 150,
            sticky: "left", // This will be the sticky column
        },
        {
            id: "email",
            label: "Email",
            accessor: "email",
            width: 200,
        },
        {
            id: "role",
            label: "Role",
            accessor: "role",
            width: 100,
            align: "center",
        },
        {
            id: "status",
            label: "Status",
            accessor: (item) => (
                <View
                    style={{
                        backgroundColor: item.status === "active" ? "#dcfce7" : "#f3f4f6",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                    }}
                >
                    <Text
                        style={{
                            color: item.status === "active" ? "#166534" : "#374151",
                            fontSize: 12,
                            fontWeight: "500",
                        }}
                    >
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            ),
            width: 120,
            align: "center",
        },
        {
            id: "lastLogin",
            label: "Last Login",
            accessor: "lastLogin",
            width: 150,
            align: "right",
        },
    ];
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sticky Table Demo</Text>
            </View>
            <View style={styles.tableContainer}>
                <StickyTableView
                    items={MOCK_DATA}
                    columns={columns}
                    theme={theme}
                    stickyColumn={{ columnId: "name", position: "left" }}
                    onItemPress={(item) => console.log("Pressed:", item.name)}
                />
            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
    },
    tableContainer: {
        flex: 1,
        padding: 16,
    },
});
