export interface State {
    ui: StateUI;
    settings: Settings;
    sections: Sections;
    data: Data;
}

export interface StateUI {
    mainMenu: MenuItem[];
    currentSection: string;
}

export interface Settings {
    metadataSection: string;
}

export interface MenuItem {
    label: string;
    children?: MenuItem[];
    action?: string;
    selected?: boolean;
    disabled?: boolean;
}

export interface Sections {
    [x:string]: any;
}

export interface Data {
    [x:string]: any;
}

export interface MetadataValueChange {
    path: string;
    value: any | null;
}

export interface MetadataMultiRowMove {
    path: string;
    idx: number;
    move: number;
}
