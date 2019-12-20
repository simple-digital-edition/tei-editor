import Vue from "vue";
import Vuex from "vuex";

import { State, MenuItem } from '@/interfaces';


Vue.use(Vuex);

const defaultState: State = {
    ui: {
        mainMenu: [
            {
                label: 'Datei',
                children: [
                    {
                        label: 'Speichern',
                        action: 'save',
                    }
                ],
            },
        ],
        sections: {},
        currentSection: ''
    }
};

export default new Vuex.Store({
  state: defaultState,
  mutations: {
      init(state, ui) {
          state.ui.sections = ui.sections;
          let menuItems = state.ui.mainMenu.slice();
          Object.keys(ui.sections).forEach((key) => {
              menuItems.push({
                  label: ui.sections[key].label,
                  action: 'section:' + key,
                  selected: false,
              });
          });
          state.ui.mainMenu = menuItems;
      },
      setCurrentSection(state, sectionName) {
          state.ui.currentSection = sectionName;
          let menuItems = state.ui.mainMenu.slice();
          menuItems.forEach((item: MenuItem) => {
              item.selected = (item.action === 'section:' + sectionName);
          });
          state.ui.mainMenu = menuItems;
      }
  },
  actions: {},
  modules: {}
});
