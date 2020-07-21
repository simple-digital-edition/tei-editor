export interface Config {
    sections: {[x: string]: TextSection | MetadataSection}
}

export interface TextSection {
    label: string;
    type: 'TextEditor';
    schema: TextEditorNodeConfig[];
    ui: {[x: string]: TextEditorSidebarBlockConfig[]};
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

export interface MetadataSection {
    label: string;
    type: 'MetadataEditor';
    schema: any;
    ui: MetadataSectionUIBlock[];
}

export interface MetadataSectionUIBlock {
    label: string;
    entries: MetadataSectionUIElement[];
}

export interface MetadataSectionUIElement {
    type: 'single-text' | 'multi-row' | 'multi-field';
    label: string;
    path: string;
    entries?: MetadataSectionUIElement[];
}

export interface MetadataBlock {
    _attrs: {[x: string]: string};
    _text: string;
    [x: string]: string | {[x: string]: string} | MetadataBlock | MetadataBlock[];
}

export interface TextDocsStore {
    [x: string]: TextDocStore;
}

export interface TextDocStore {
    doc: any;  // TODO: These should be replaced with actual Prosemirror Nodes
    nested: {[x: string]: {[y: string]: any}};
}
