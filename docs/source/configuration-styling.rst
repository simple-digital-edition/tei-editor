Styling
=======

The core TEI editor comes with the minimal styling needed to layout the editor.

Text Editor
-----------

All ``block`` and ``wrapping`` ``TagElement``\ s are rendered as ``<div>`` elements, with the ``class`` attribute set
to ``"node-{TagElementName}"``. ``inline`` ``TagElement``\ s are rendered as ``<span>`` elements, with the ``class``
attribute set to ``"node-{TagElementName}"``.

All ``mark`` ``TagElement``\ s are rendered as ``<span>`` elements, with the ``class`` attribute set to
``"mark-{TagElementName}"``.

All ``TagElement``\ s attributes are added to the respective ``<div>`` or ``<span>`` elements as
``data-attributeName="attributeValue"``.

Metadata Editor
---------------

For each ``MetadataEditorUISection`` a ``<section>`` tag is generated. For ``MetadataEditorUIElement``\ s that have
a ``multi-row`` or ``multi-field`` ``type`` an ``<ol>`` tag is generated with the ``class`` attribute set to the
``type``.

Additionally for the ``multi-row`` elements there is an ``<ul role="menubar">`` that contains the buttons for adding,
removing, and re-ordering the multi-row children.
