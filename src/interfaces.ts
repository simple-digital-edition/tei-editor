export interface MenuItemConfig {
    label: string;
    children: MenuItemConfig[] | null;
    action: string | null;
}
