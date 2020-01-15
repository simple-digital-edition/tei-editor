import Vue from "vue";
import Vuex from "vuex";

import { State, MenuItem, MetadataValueChange, MetadataMultiRowMove } from '@/interfaces';
import TEIMetadataParser from '@/util/TEIMetadataParser';
import TEITextParser from '@/util/TEITextParser';
import deepclone from '@/util/deepclone';
import get from '@/util/get';

Vue.use(Vuex);

const defaultState: State = {
    ui: {
        mainMenu: [
            {
                label: 'File',
                children: [
                    {
                        label: 'Save',
                        action: 'save',
                    }
                ],
            },
        ],
        currentSection: '',
    },
    settings: {
        metadataSection: '',
    },
    sections: {},
    data: {},
};

export default new Vuex.Store({
  state: defaultState,
  mutations: {
      init(state, config) {
          state.sections = config.sections;
          let menuItems = state.ui.mainMenu.slice();
          Object.keys(config.sections).forEach((key, idx) => {
              menuItems.push({
                  label: config.sections[key].label,
                  action: 'section:' + key,
                  selected: idx === 0,
              });
              if (idx === 0) {
                  state.ui.currentSection = key;
              }
              if (config.sections[key].type === 'MetadataEditor') {
                  state.settings.metadataSection = key;
              }
          });
          state.ui.mainMenu = menuItems;
      },

      setCurrentSection(state, sectionName: string) {
          state.ui.currentSection = sectionName;
          let menuItems = state.ui.mainMenu.slice();
          menuItems.forEach((item: MenuItem) => {
              item.selected = (item.action === 'section:' + sectionName);
          });
          state.ui.mainMenu = menuItems;
      },

      load(state, sourceData: string) {
          let domParser = new DOMParser();
          let dom = domParser.parseFromString(sourceData, 'application/xml');
          Object.entries(state.sections).forEach(([key, config]) => {
              if (config.type === 'MetadataEditor') {
                  Vue.set(state.data, key, (new TEIMetadataParser(dom, config)).get());
              } else if (config.type === 'TextEditor') {
                  let [doc, nestedDocs] = (new TEITextParser(dom, config)).get();
                  Vue.set(state.data, key, {doc: doc, nested: nestedDocs});
              }
          });
      },

      setMetadataValue(state, payload: MetadataValueChange) {
          // Set a metadata value. Will create missing data structures, except for missing multi-row fields
          let metadata = state.data[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let current = metadata;
              let pathElements = payload.path.split('.');
              while (pathElements.length > 0) {
                  let pathElement = pathElements[0];
                  if (pathElement[0] === '[' && pathElement[pathElement.length - 1] === ']' && Array.isArray(current)) {
                      let pathIndex = Number.parseInt(pathElement.substring(1, pathElement.length - 1));
                      if (pathIndex >= 0 && pathIndex < current.length) {
                          if (pathElements.length > 1) {
                              current = current[pathIndex];
                          } else {
                              current[pathIndex] = payload.value;
                          }
                      }
                  } else {
                      if (current[pathElement]) {
                          if (pathElements.length > 1) {
                              current = current[pathElement];
                          } else {
                              current[pathElement] = payload.value;
                          }
                      } else {
                          if (pathElements.length > 1) {
                              current[pathElement] = {};
                              current = current[pathElement];
                          } else {
                              current[pathElement] = payload.value;
                          }
                      }
                  }
                  pathElements.splice(0, 1);
              }
              Vue.set(state.data, state.settings.metadataSection, metadata);
          }
      },

      addMetadataMuliRow(state, payload: MetadataValueChange) {
          let metadata = state.data[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let parent = get(metadata, payload.path);
              if (parent) {
                  parent.push(payload.value);
                  Vue.set(state.data, state.settings.metadataSection, metadata);
              }
          }
      },

      removeMetadataMultiRow(state, payload: MetadataValueChange) {
          let metadata = state.data[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let parent = get(metadata, payload.path);
              if (parent && payload.value >= 0 && payload.value < parent.length) {
                  parent.splice(payload.value, 1);
                  Vue.set(state.data, state.settings.metadataSection, metadata);
              }
          }
      },

      moveMetadataMultiRow(state, payload: MetadataMultiRowMove) {
          let metadata = state.data[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let parent = get(metadata, payload.path);
              if (parent && payload.idx >= 0 && payload.idx < parent.length && payload.idx + payload.move >= 0 && payload.idx + payload.move < parent.length) {
                  let item = parent[payload.idx];
                  parent.splice(payload.idx, 1);
                  parent.splice(payload.idx + payload.move, 0, item);
                  Vue.set(state.data, state.settings.metadataSection, metadata);
              }
          }
      },

      addNestedDoc(state, payload: any) {
          Vue.set(state.data[payload.section].nested[payload.nodeType], payload.nodeId, {
              type: payload.nodeType,
              content: [
                  {
                      type: 'doc',
                      content: []
                  }
              ],
              attrs: {
                  'xml:id': payload.nodeId
              }
          })
      },

      setTextDoc(state, payload: any) {
          let path = payload.path.split('.');
          let obj = state.data[payload.section];
          while (path.length > 0) {
              let pathElement = path[0];
              if (pathElement[0] === '[' && pathElement[pathElement.length - 1] === ']') {
                  pathElement = Number.parseInt(pathElement.slice(1, pathElement.length - 1));
              }
              if (obj[pathElement]) {
                  if (path.length > 1) {
                      obj = obj[pathElement];
                  } else {
                      Vue.set(obj, pathElement, payload.doc);
                  }
              } else {
                  if (path.length > 1) {
                      Vue.set(obj, pathElement, {});
                  } else {
                      Vue.set(obj, pathElement, payload.doc);
                  }
              }
              path.splice(0, 1);
          }
      }
  },
  actions: {},
  modules: {}
});
