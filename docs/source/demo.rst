####
Demo
####

Below is a demo showing all features provided by the TEI editor:

.. raw:: html

  <iframe src="_static/demo/index.html" style="width:100%;height:30rem;border:1px solid #dddddd;"></iframe>

The editor above uses the following configuration:

.. sourcecode:: json

  {
      "sections": {
          "body": {
              "label": "Main Text",
              "type": "TextEditor",
              "parser": {
                  "selector": "tei:text/tei:group/tei:body[@type=\"main\"]"
              },
              "serialiser": {
                  "tag": "tei:text/tei:group/tei:body",
                  "attrs": {
                      "type": "main"
                  }
              },
              "schema": [
                  {
                      "name": "paragraph",
                      "type": "block",
                      "attrs": {
                          "alignment": {
                              "default": "left",
                              "parsers": [
                                  {
                                      "selector": "contains(@style, 'align-left')",
                                      "type": "static",
                                      "value": "left"
                                  },
                                  {
                                      "selector": "contains(@style, 'align-center')",
                                      "type": "static",
                                      "value": "center"
                                  },
                                  {
                                      "selector": "contains(@style, 'align-right')",
                                      "type": "static",
                                      "value": "right"
                                  },
                                  {
                                      "selector": "contains(@style, 'align-justify')",
                                      "type": "static",
                                      "value": "justify"
                                  }
                              ],
                              "serialiser": {
                                  "attr": "style",
                                  "value": "align-{value}"
                              }
                          }
                      },
                      "parser": {
                          "selector": "tei:p"
                      },
                      "serialiser": {
                          "tag": "tei:p"
                      }
                  },
                  {
                      "name": "heading",
                      "type": "block",
                      "attrs": {
                          "level": {
                              "default": "1",
                              "parser": {
                                  "selector": "substring(@type, 7)"
                              },
                              "serialiser": {
                                  "attr": "type",
                                  "value": "level-{value}"
                              }
                          },
                          "navIdentifier": {
                              "default": "",
                              "parser": {
                                  "selector": "@data-navIdentifier"
                              },
                              "serialiser": {
                                  "attr": "data-navIdentifier"
                              }
                          }
                      },
                      "parser": {
                          "selector": "tei:head"
                      },
                      "serialiser": {
                          "tag": "tei:head"
                      }
                  },
                  {
                      "name": "listItem",
                      "type": "block",
                      "parser": {
                          "selector": "tei:item"
                      },
                      "serialiser": {
                          "tag": "tei:item"
                      }
                  },
                  {
                      "name": "list",
                      "type": "wrapping",
                      "content": "listItem",
                      "parser": {
                          "selector": "tei:list"
                      },
                      "serialiser": {
                          "tag": "tei:list"
                      }
                  },
                  {
                      "name": "text",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:seg",
                              "text": "text()"
                          },
                          {
                              "selector": "tei:hi",
                              "text": "text()"
                          }
                      ],
                      "serialiser": {
                          "tag": "tei:seg"
                      }
                  },
                  {
                      "name": "proof",
                      "type": "inline",
                      "parser": {
                          "selector": "tei:metamark[@function=\"proof\"]",
                          "text": "text()"
                      },
                      "serialiser": {
                          "tag": "tei:metamark",
                          "attrs": {
                              "function": "proof"
                          }
                      }
                  },
                  {
                      "name": "footnoteMarker",
                      "type": "inline",
                      "parser": {
                          "selector": "tei:ref[@type=\"footnote\"]",
                          "text": "text()"
                      },
                      "serialiser": {
                          "tag": "tei:ref",
                          "attrs": {
                              "type": "footnote"
                          }
                      },
                      "attrs": {
                          "target": {
                              "default": "",
                              "parser": {
                                  "selector": "substring(@target, 2)"
                              },
                              "serialiser": {
                                  "attr": "target",
                                  "value": "#{value}"
                              }
                          }
                      },
                      "reference": {
                          "type": "footnote",
                          "attr": "target"
                      }
                  },
                  {
                      "name": "footnote",
                      "type": "nested",
                      "parser": {
                          "selector": "tei:note[@type=\"footnote\"]"
                      },
                      "serialiser": {
                          "tag": "tei:note",
                          "attrs": {
                              "type": "footnote"
                          }
                      },
                      "attrs": {
                          "id": {
                              "parser": {
                                  "selector": "@xml:id"
                              },
                              "serialiser": {
                                  "attr": "xml:id"
                              }
                          },
                          "type": {
                              "default": "footnote"
                          }
                      }
                  },
                  {
                      "name": "annotationMarker",
                      "type": "inline",
                      "parser": {
                          "selector": "tei:ref[@type=\"annotation\"]",
                          "text": "text()"
                      },
                      "serialiser": {
                          "tag": "tei:ref",
                          "attrs": {
                              "type": "annotation"
                          }
                      },
                      "attrs": {
                          "target": {
                              "default": "",
                              "parser": {
                                  "selector": "substring(@target, 2)"
                              },
                              "serialiser": {
                                  "attr": "target",
                                  "value": "#{value}"
                              }
                          }
                      },
                      "reference": {
                          "type": "annotation",
                          "attr": "target"
                      }
                  },
                  {
                      "name": "annotation",
                      "type": "nested",
                      "parser": {
                          "selector": "tei:interp"
                      },
                      "serialiser": {
                          "tag": "tei:interp"
                      },
                      "attrs": {
                          "id": {
                              "parser": {
                                  "selector": "@xml:id"
                              },
                              "serialiser": {
                                  "attr": "xml:id"
                              }
                          }
                      }
                  },
                  {
                      "name": "bold",
                      "type": "mark",
                      "parser": {
                          "selector": "contains(@style, 'bold')"
                      },
                      "serialiser": {
                          "tag": "tei:hi",
                          "attrs": {
                              "style": {
                                  "value": "bold"
                              }
                          }
                      }
                  },
                  {
                      "name": "italic",
                      "type": "mark",
                      "parser": {
                          "selector": "contains(@style, 'italic')"
                      },
                      "serialiser": {
                          "tag": "tei:hi",
                          "attrs": {
                              "style": {
                                  "value": "italic"
                              }
                          }
                      }
                  },
                  {
                      "name": "fontSize",
                      "type": "mark",
                      "parsers": [
                          {
                              "selector": "contains(@style, 'font-size-large')"
                          },
                          {
                              "selector": "contains(@style, 'font-size-small')"
                          }
                      ],
                      "serialiser": {
                          "tag": "tei:hi"
                      },
                      "attrs": {
                          "size": {
                              "default": "",
                              "parsers": [
                                  {
                                      "selector": "contains(@style, 'font-size-large')",
                                      "type": "static",
                                      "value": "large"
                                  },
                                  {
                                      "selector": "contains(@style, 'font-size-small')",
                                      "type": "static",
                                      "value": "small"
                                  }
                              ],
                              "serialiser": {
                                  "attr": "style",
                                  "value": "font-size-{value}"
                              }
                          }
                      }
                  }
              ],
              "ui": {
                  "doc": [
                      {
                          "label": "Blocks",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "setNodeType",
                                          "label": "Heading",
                                          "nodeType": "heading"
                                      },
                                      {
                                          "type": "setNodeType",
                                          "label": "Paragraph",
                                          "nodeType": "paragraph"
                                      },
                                      {
                                          "type": "setNodeType",
                                          "label": "List",
                                          "nodeType": "list"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Annotations",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "setNodeType",
                                          "label": "Proof",
                                          "nodeType": "proof"
                                      },
                                      {
                                          "type": "setNodeType",
                                          "label": "Footnote",
                                          "nodeType": "footnoteMarker"
                                      },
                                      {
                                          "type": "setNodeType",
                                          "label": "Annotation",
                                          "nodeType": "annotationMarker"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Markup",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "toggleMark",
                                          "label": "<svg viewBox=\"0 0 24 24\" class=\"mdi-icon\"><path d=\"M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z\" /></svg>",
                                          "markType": "bold",
                                          "ariaLabel": "Bold"
                                      },
                                      {
                                          "type": "toggleMark",
                                          "label": "<svg viewBox=\"0 0 24 24\" class=\"mdi-icon\"><path d=\"M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z\" /></svg>",
                                          "markType": "italic",
                                          "ariaLabel": "Italic"
                                      },
                                      {
                                        "type": "selectMarkAttr",
                                        "markType": "fontSize",
                                        "attr": "size",
                                        "values": [{"value": "", "label": "Normal"}, {"value": "small", "label": "Small"}, {"value": "large", "label": "Large"}]
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Heading",
                          "condition": {
                              "type": "isActive",
                              "activeType": "heading"
                          },
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "selectNodeAttr",
                                          "nodeType": "heading",
                                          "attr": "level",
                                          "values": [{"label": "Level 1", "value": "1"}, {"label": "Level 2", "value": "2"}]
                                      }
                                  ]
                              },
                              {
                                  "type": "list",
                                  "entities": [
                                      {
                                          "type": "setNodeAttrString",
                                          "nodeType": "heading",
                                          "attr": "navIdentifier",
                                          "label": "Navigation Identifier"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Paragraph",
                          "condition": {
                              "type": "isActive",
                              "activeType": "paragraph"
                          },
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "left",
                                          "label": "Left"
                                      },
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "center",
                                          "label": "Center"
                                      },
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "right",
                                          "label": "Right"
                                      },
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "justify",
                                          "label": "Justify"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Footnote",
                          "condition": {
                              "type": "isActive",
                              "activeType": "footnoteMarker"
                          },
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "editNestedDoc",
                                          "nodeType": "footnoteMarker",
                                          "attr": "target",
                                          "label": "Edit",
                                          "targetNodeType": "footnote"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Annotation",
                          "condition": {
                              "type": "isActive",
                              "activeType": "annotationMarker"
                          },
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "linkNestedDoc",
                                          "nodeType": "annotationMarker",
                                          "attr": "target",
                                          "targetNodeType": "annotation"
                                      },
                                      {
                                          "type": "editNestedDoc",
                                          "nodeType": "annotationMarker",
                                          "attr": "target",
                                          "label": "Edit",
                                          "targetNodeType": "annotation"
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  "footnote": [
                      {
                          "label": "Footnote",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "closeNested",
                                          "label": "Close"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Markup",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "toggleMark",
                                          "label": "Bold",
                                          "markType": "bold"
                                      },
                                      {
                                          "type": "toggleMark",
                                          "label": "Italic",
                                          "markType": "italic"
                                      },
                                      {
                                        "type": "selectMarkAttr",
                                        "markType": "fontSize",
                                        "attr": "size",
                                        "values": [{"value": "", "label": "Normal"}, {"value": "small", "label": "Small"}, {"value": "large", "label": "Large"}]
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  "annotation": [
                      {
                          "label": "Annotation",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "closeNested",
                                          "label": "Close"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Markup",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "toggleMark",
                                          "label": "Bold",
                                          "markType": "bold"
                                      },
                                      {
                                          "type": "toggleMark",
                                          "label": "Italic",
                                          "markType": "italic"
                                      },
                                      {
                                        "type": "selectMarkAttr",
                                        "markType": "fontSize",
                                        "attr": "size",
                                        "values": [{"value": "", "label": "Normal"}, {"value": "small", "label": "Small"}, {"value": "large", "label": "Large"}]
                                      }
                                  ]
                              }
                          ]
                      }
                  ]
              }
          },
          "apparatus": {
              "label": "Apparatus",
              "type": "TextEditor",
              "parser": {
                  "selector": "tei:text/tei:group/tei:body[@type=\"apparatus\"]"
              },
              "serialiser": {
                  "tag": "tei:text/tei:group/tei:body",
                  "attrs": {
                      "type": "apparatus"
                  }
              },
              "schema": [
                  {
                      "name": "paragraph",
                      "label": "Paragraph",
                      "type": "block",
                      "attrs": {
                          "alignment": {
                              "default": "left",
                              "parsers": [
                                  {
                                      "selector": "contains(@style, 'align-left')",
                                      "type": "static",
                                      "value": "left"
                                  },
                                  {
                                      "selector": "contains(@style, 'align-center')",
                                      "type": "static",
                                      "value": "center"
                                  },
                                  {
                                      "selector": "contains(@style, 'align-right')",
                                      "type": "static",
                                      "value": "right"
                                  },
                                  {
                                      "selector": "contains(@style, 'align-justify')",
                                      "type": "static",
                                      "value": "justify"
                                  }
                              ],
                              "serialiser": {
                                  "attr": "style",
                                  "value": "align-{value}"
                              }
                          }
                      },
                      "parser": {
                          "selector": "tei:p"
                      },
                      "serialiser": {
                          "tag": "tei:p"
                      }
                  },
                  {
                      "name": "heading",
                      "label": "Heading",
                      "type": "block",
                      "attrs": {
                          "level": {
                              "default": "1",
                              "parser": {
                                  "selector": "substring(@type, 7)"
                              },
                              "serialiser": {
                                  "attr": "type",
                                  "value": "level-{value}"
                              }
                          },
                          "navIdentifier": {
                              "default": "",
                              "parser": {
                                  "selector": "@data-navIdentifier"
                              },
                              "serialiser": {
                                  "attr": "data-navIdentifier"
                              }
                          }
                      },
                      "parser": {
                          "selector": "tei:head"
                      },
                      "serialiser": {
                          "tag": "tei:head"
                      }
                  },
                  {
                      "name": "text",
                      "type": "inline",
                      "parsers": [
                          {
                              "selector": "tei:seg",
                              "text": "text()"
                          },
                          {
                              "selector": "tei:hi",
                              "text": "text()"
                          }
                      ],
                      "serialiser": {
                          "tag": "tei:seg"
                      }
                  },
                  {
                      "name": "proof",
                      "type": "inline",
                      "parser": {
                          "selector": "tei:metamark[@function=\"proof\"]",
                          "text": "text()"
                      },
                      "serialiser": {
                          "tag": "tei:metamark",
                          "attrs": {
                              "function": "proof"
                          }
                      },
                      "attrs": {
                          "function": {
                              "default": "proof"
                          }
                      }
                  },
                  {
                      "name": "bold",
                      "type": "mark",
                      "parser": {
                          "selector": "contains(@style, 'bold')"
                      },
                      "serialiser": {
                          "tag": "tei:hi",
                          "attrs": {
                              "style": {
                                  "value": "bold"
                              }
                          }
                      }
                  },
                  {
                      "name": "italic",
                      "type": "mark",
                      "parser": {
                          "selector": "contains(@style, 'italic')"
                      },
                      "serialiser": {
                          "tag": "tei:hi",
                          "attrs": {
                              "style": {
                                  "value": "italic"
                              }
                          }
                      }
                  },
                  {
                      "name": "fontSize",
                      "type": "mark",
                      "parsers": [
                          {
                              "selector": "contains(@style, 'font-size-large')"
                          },
                          {
                              "selector": "contains(@style, 'font-size-small')"
                          }
                      ],
                      "serialiser": {
                          "tag": "tei:hi"
                      },
                      "attrs": {
                          "size": {
                              "default": "",
                              "parsers": [
                                  {
                                      "selector": "contains(@style, 'font-size-large')",
                                      "type": "static",
                                      "value": "large"
                                  },
                                  {
                                      "selector": "contains(@style, 'font-size-small')",
                                      "type": "static",
                                      "value": "small"
                                  }
                              ],
                              "serialiser": {
                                  "attr": "style",
                                  "value": "font-size-{value}"
                              }
                          }
                      }
                  }
              ],
              "ui": {
                  "doc": [
                      {
                          "label": "Blocks",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "setNodeType",
                                          "label": "Heading",
                                          "nodeType": "heading"
                                      },
                                      {
                                          "type": "setNodeType",
                                          "label": "Paragraph",
                                          "nodeType": "paragraph"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Annotations",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                         "type": "setNodeType",
                                         "label": "Proof",
                                         "nodeType": "proof"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Markup",
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "toggleMark",
                                          "label": "Bold",
                                          "markType": "bold"
                                      },
                                      {
                                          "type": "toggleMark",
                                          "label": "Italic",
                                          "markType": "italic"
                                      },
                                      {
                                        "type": "selectMarkAttr",
                                        "markType": "fontSize",
                                        "attr": "size",
                                        "values": [{"value": "", "label": "Normal"}, {"value": "small", "label": "Small"}, {"value": "large", "label": "Large"}]
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Heading",
                          "condition": {
                              "type": "isActive",
                              "activeType": "heading"
                          },
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "selectNodeAttr",
                                          "nodeType": "heading",
                                          "attr": "level",
                                          "values": [{"label": "Level 1", "value": "1"}, {"label": "Level 2", "value": "2"}]
                                      }
                                  ]
                              },
                              {
                                  "type": "list",
                                  "entities": [
                                      {
                                          "type": "setNodeAttrString",
                                          "nodeType": "heading",
                                          "attr": "navIdentifier",
                                          "label": "Navigation Identifier"
                                      }
                                  ]
                              }
                          ]
                      },
                      {
                          "label": "Paragraph",
                          "condition": {
                              "type": "isActive",
                              "activeType": "paragraph"
                          },
                          "entities": [
                              {
                                  "type": "menubar",
                                  "entities": [
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "left",
                                          "label": "Left"
                                      },
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "center",
                                          "label": "Center"
                                      },
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "right",
                                          "label": "Right"
                                      },
                                      {
                                          "type": "setNodeAttrValue",
                                          "nodeType": "paragraph",
                                          "attr": "alignment",
                                          "value": "justify",
                                          "label": "Justify"
                                      }
                                  ]
                              }
                          ]
                      }
                  ]
              }
          },
          "metadata": {
              "label": "Metadata",
              "type": "MetadataEditor",
              "schema": [
                  {
                      "tag": "tei:fileDesc",
                      "children": [
                          {
                              "tag": "tei:titleStmt",
                              "children": [
                                  {
                                      "tag": "tei:title",
                                      "text": "fileDesc.titleStmt.title._text"
                                  },
                                  {
                                      "tag": "tei:author",
                                      "text": "fileDesc.titleStmt.author._text"
                                  },
                                  {
                                      "tag": "tei:respStmt",
                                      "multiple": true,
                                      "attrs": {
                                          "xml:id": "_attrs.xml:id"
                                      },
                                      "children": [
                                          {
                                              "tag": "tei:resp",
                                              "text": "resp._text",
                                              "multiple": true
                                          },
                                          {
                                              "tag": "tei:name",
                                              "text": "name._text",
                                              "multiple": true
                                          }
                                      ]
                                  }
                              ]
                          },
                          {
                              "tag": "tei:publicationStmt",
                              "children": [
                                  {
                                      "tag": "tei:distributor",
                                      "text": "fileDesc.publicationStmt.distributor._text"
                                  }
                              ]
                          }
                      ]
                  }
              ],
              "ui": [
                  {
                      "label": "Bibliography",
                      "entries": [
                          {
                              "type": "single-text",
                              "label": "Title",
                              "path": "fileDesc.titleStmt.title._text"
                          },
                          {
                              "type": "single-text",
                              "label": "Author",
                              "path": "fileDesc.titleStmt.author._text"
                          }
                      ]
                  },
                  {
                      "label": "Digital Version",
                      "entries": [
                          {
                              "type": "single-text",
                              "label": "Distributor",
                              "path": "fileDesc.publicationStmt.distributor._text"
                          }
                      ]
                  },
                  {
                      "label": "Responsibilities",
                      "entries": [
                          {
                              "type": "multi-row",
                              "path": "fileDesc.titleStmt.respStmt",
                              "entries": [
                                  {
                                      "type": "multi-field",
                                      "path": "",
                                      "entries": [
                                          {
                                              "type": "single-text",
                                              "label": "Identifier",
                                              "path": "._attrs.xml:id"
                                          },
                                          {
                                              "type": "multi-row",
                                              "path": ".resp",
                                              "entries": [
                                                  {
                                                      "type": "single-text",
                                                      "label": "Responsible for",
                                                      "path": "._text"
                                                  }
                                              ]
                                          },
                                          {
                                              "type": "multi-row",
                                              "path": ".name",
                                              "entries": [
                                                  {
                                                      "type": "single-text",
                                                      "label": "Name",
                                                      "path": "._text"
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          }
                      ]
                  }
              ]
          }
      }
  }

The editor also uses the following callbacks:

.. sourcecode:: html

  <script type="application/javascript">
    window.TEIEditor = {
        callbacks: {
            load: function(callback) {
                let fileSelector = document.createElement('input');
                fileSelector.setAttribute('type', 'file');
                fileSelector.setAttribute('class', 'hidden');
                document.querySelector('body').appendChild(fileSelector);
                fileSelector.click();
                fileSelector.addEventListener('change', function(ev) {
                    let files = ev.target.files;
                    if (files.length > 0) {
                        let reader = new FileReader();
                        reader.onload = (ev) => {
                            callback(ev.target.result);
                        }
                        reader.readAsText(files[0]);
                    }
                    fileSelector.remove();
                });
            },
            autoLoad: function(callback) {
                let docElement = document.getElementById('TEIEditorDocument');
                if (docElement) {
                    callback(docElement.innerHTML);
                }
            },
            save: function(data) {
                let blob = new Blob([data], {type: 'text/xml;charset=utf-8'});
                let link = document.createElement('a');
                link.setAttribute('href', URL.createObjectURL(blob));
                link.setAttribute('download', 'download.tei');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
  </script>
