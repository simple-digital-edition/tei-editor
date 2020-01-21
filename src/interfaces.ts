export interface State {
    ui: StateUI;
    settings: Settings;
    sections: Sections;
    data: Data;
    callbacks: Callbacks;
}

export interface StateUI {
    currentSection: string;
}

export interface Settings {
    metadataSection: string;
}

export interface Sections {
    [x:string]: any;
}

export interface Data {
    [x:string]: any;
}

export interface Callbacks {
    save?: (data: any) => {};
    load?: ((data: any) => {}) => {};
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
