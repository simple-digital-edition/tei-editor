export interface State {
    ui: StateUI;
}

export interface StateUI {
    mainMenu: MenuItem[];
    sections: UISections;
    currentSection: string;
}

export interface MenuItem {
    label: string;
    children?: MenuItem[];
    action?: string;
    selected?: boolean;
}

export interface UISections {
    [x:string]: object;
}
