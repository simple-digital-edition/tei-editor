import Vue from "vue";
import Vuex from "vuex";

import { State, MetadataValueChange, MetadataMultiRowMove } from '@/interfaces';
import TEIMetadataParser from '@/util/TEIMetadataParser';
import TEITextParser from '@/util/TEITextParser';
import deepclone from '@/util/deepclone';
import get from '@/util/get';

Vue.use(Vuex);

const defaultState: State = {
    settings: {
        metadataSection: '',
    },
    sections: {},
    content: {},
    callbacks: {}
};

export default new Vuex.Store({
  state: defaultState,
  mutations: {
      init(state, config) {
          state.sections = config.sections;
          Object.keys(config.sections).forEach((key, idx) => {
              if (config.sections[key].type === 'MetadataEditor') {
                  state.settings.metadataSection = key;
              }
              Vue.set(state.content, key, {});
              Vue.set(state.content[key], 'doc', null);
              Vue.set(state.content[key], 'nested', {});
          });
          // @ts-ignore
          if (window.TEIEditor && window.TEIEditor.callbacks) {
              // @ts-ignore
              state.callbacks.save = window.TEIEditor.callbacks.save || null;
              // @ts-ignore
              state.callbacks.load = window.TEIEditor.callbacks.load || null;
              // @ts-ignore
              state.callbacks.autoLoad = window.TEIEditor.callbacks.autoLoad || null;
          }
      },

      setMetadata(state, metadata: any) {
          Vue.set(state.content, state.settings.metadataSection, metadata);
      },

      setMetadataValue(state, payload: MetadataValueChange) {
          // Set a metadata value. Will create missing data structures, except for missing multi-row fields
          let metadata = state.content[state.settings.metadataSection];
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
              Vue.set(state.content, state.settings.metadataSection, metadata);
          }
      },

      addMetadataMuliRow(state, payload: MetadataValueChange) {
          let metadata = state.content[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let parent = get(metadata, payload.path);
              if (parent) {
                  parent.push(payload.value);
                  Vue.set(state.content, state.settings.metadataSection, metadata);
              }
          }
      },

      removeMetadataMultiRow(state, payload: MetadataValueChange) {
          let metadata = state.content[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let parent = get(metadata, payload.path);
              if (parent && payload.value >= 0 && payload.value < parent.length) {
                  parent.splice(payload.value, 1);
                  Vue.set(state.content, state.settings.metadataSection, metadata);
              }
          }
      },

      moveMetadataMultiRow(state, payload: MetadataMultiRowMove) {
          let metadata = state.content[state.settings.metadataSection];
          if (metadata) {
              metadata = deepclone(metadata);
              let parent = get(metadata, payload.path);
              if (parent && payload.idx >= 0 && payload.idx < parent.length && payload.idx + payload.move >= 0 && payload.idx + payload.move < parent.length) {
                  let item = parent[payload.idx];
                  parent.splice(payload.idx, 1);
                  parent.splice(payload.idx + payload.move, 0, item);
                  Vue.set(state.content, state.settings.metadataSection, metadata);
              }
          }
      },

      setTextDoc(state, payload: any) {
          let path = payload.path.split('.');
          if (path.length === 2) {
              Vue.set(state.content[path[0]], path[1], payload.doc);
          } else if(path.length === 4) {
              Vue.set(state.content[path[0]].nested[path[2]][path[3]], 'content', [payload.doc]);
          }
      },

      addNestedDoc(state, payload: any) {
          let path = payload.path.split('.');
          if (path.length === 4) {
              if (!state.content[path[0]].nested[path[2]]) {
                  Vue.set(state.content[path[0]].nested, path[2], {});
              }
              Vue.set(state.content[path[0]].nested[path[2]], path[3], {
                  attrs: {
                      id: path[3],
                  },
                  content: [
                      payload.doc,
                  ],
                  nestedDoc: true,
                  type: path[2],
              });
          }
      },
  },
  actions: {
      load({ commit, state }, sourceData: string) {
          let domParser = new DOMParser();
          let dom = domParser.parseFromString(sourceData, 'application/xml');
          Vue.set(state, 'content', {});
          Object.keys(state.sections).forEach((key, idx) => {
              Vue.set(state.content, key, {});
              Vue.set(state.content[key], 'doc', null);
              Vue.set(state.content[key], 'nested', {});
          });
          Object.entries(state.sections).forEach(([key, config]) => {
              if (config.type === 'MetadataEditor') {
                  commit('setMetadata', (new TEIMetadataParser(dom, config)).get())
              } else if (config.type === 'TextEditor') {
                  let [doc, nestedDocs] = (new TEITextParser(dom, config)).get();
                  commit('setTextDoc', { path: key + '.doc', doc: doc });
                  Object.entries(nestedDocs).forEach(([nestedKey, docs]: any) => {
                      Object.entries(docs).forEach(([docKey, doc]: any) => {
                          commit('addNestedDoc', {path: key + '.nested.' + nestedKey + '.' + docKey, doc: doc.content[0]});
                      });
                  })
              }
          });
      }
  },
  modules: {}
});
