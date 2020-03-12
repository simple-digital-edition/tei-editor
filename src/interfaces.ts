export interface State {
    settings: Settings;
    sections: Sections;
    content: Data;
    callbacks: Callbacks;
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
    load?: (callback: (data: any) => {}) => {};
    autoLoad?: (callback: (data: any) => {}) => {};
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

export interface TextEditorNodeConfig {
    type: 'block' | 'inline' | 'wrapping' | 'mark';
    name: string;
    content?: string;
    attrs: { [x: string]: TextEditorNodeAttribute };
}

export interface TextEditorNodeAttribute {

}

export interface TextEditorSidebarBlockConfig {
    label: string;
    condition: TextEditorSidebarConditionConfig;
    entities: TextEditorSidebarSectionConfig[];
}

export interface TextEditorSidebarConditionConfig {
    type: 'isActive';
    activeType: string;
}

export interface TextEditorSidebarSectionConfig {
    type: 'list' | 'menubar';
    entities: TextEditorSidebarElementConfig[];
}

export interface TextEditorSidebarElementConfig {
    type: string;
    attr: string;
    label: string;
    values: {[x: string]: string}[];
    nodeType?: string;
    markType?: string;
    ariaLabel?: string;
    value?: string;
    targetNodeType?: string;
}

export interface TextEditorActiveElements {
    [x: string]: {[y: string]: string};
}

export interface TextEditorMenuItem {
    type: string;
    attr: string;
    label: string;
    values: {[x: string]: string}[];
    nodeType?: string;
    markType?: string;
    ariaLabel?: string;
    value?: string;
    targetNodeType?: string;
}

export interface TextEditorMenuItemValuesValue {
    label: string;
    value: string;
}
