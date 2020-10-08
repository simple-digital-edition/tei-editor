Editor Sections
===============

The configuration must be made available via a ``<script>`` tag with the ``id`` attribute set to "TEIEditorConfig" and
the ``type`` set to "application/json":

.. sourcecode:: html

  <script id="TEIEditorConfig" type="application/json">
    {
      "sections": ...
    }
  </script>

The configuration itself is provided as one large JSON object, which is documented here. The documentation uses a
semi-formal format, mainly showing the individual JSON objects that make up the configuration, with some additional
markers:

* Optional keys are marked with "?".
* Keys that can be repeated are marked with "+".
* Nested JSON objects are indicated with a camel-case value (e.g. "ParserElement"). When creating an actual
  configuration object, these are replaced with the nested JSON object.
* Customisable values are indicates by the values "AnyString" (any string content allowed), "AnyHTMLString" (any HTML
  content is allowed), and "Boolean" (true or false).
* Choices are marked using the pipe "|" symbol.
* Fixed values are indicated using values that start with a lower-case letter.
* Where lists are shown with a single value, this value can be repeated as often as required.

The top-level configuration object is structured as follows:

.. sourcecode:: json

  {
    "sections": {
      "+SectionIdentifier": "TextEditorSection | MetadataEditorSection"
    }
  }

It consists of one or more section identifier keys, each of which has either a ``TextEditorSection`` or a
``MetadataEditorSection`` object as its value. The TEI Editor can handle any number of ``TextEditorSection``, however
there may be at most one ``MetadataEditorSection``.

TextEditorSection
-----------------

The ``TextEditorSection`` represents a section in which the user can edit a TEI text block:

.. sourcecode:: json

  {
    "label": "AnyString",
    "type": "TextEditor",
    "parser": "ParserElement",
    "serialiser": "SerialiserElement",
    "schema": [
      "TagElement"
    ],
    "ui": "TextEditorUIElement"
  }

The ``label`` can be any string value and is used in the UI to allow the user to navigate to this section. The ``type``
must be ``"TextEditor"``. The ``parser`` configuration is used to identify the root element in the TEI document that
contains the text to be edited in this section. The ``serialiser`` configuration is used to identify the root element
in the TEI document that the edited text is to be written to. The ``schema`` contains a list of ``TagElement`` objects
that identify the various markup elements that can be used to annotate the text edited in this section. The ``ui``
contains a ``TextEditorUIElement`` that configures the sidebar that contains the markup user-interface controls.

There is one limitation in the ``schema`` and that is that you **must** specify one ``TagElement`` that has the
``name`` set to ``"text"``. This is the basic text element and is the only required ``TagElement``.

TagElement
++++++++++

The ``TagElement`` represents one markup tag that is used in the TEI text edited in the section it is specified in.

.. sourcecode:: json

  {
    "name": "AnyString",
    "type": "block | wrapping | nested | inline | mark",
    "attrs": {
      "+AttributeName": "ElementAttribute"
    },
    "?parser": "ParserElement",
    "?parsers": ["ParserElement"],
    "serialiser": "SerialiserElement",
    "?content": "ElementName",
    "?reference": "NestedReferenceElement"
  }

The ``name`` can be any value, but each ``name`` **must** be unique within the ``TextEditorSection`` and there **must**
be exactly one ``TagElement`` with the ``name`` set to ``"text"``. The ``type`` defines the type of markup the
``TagElement`` represents:

* *block*: A basic block-level element.
* *wrapping*: A block-level element that contains another block-level element. The name of the inner block-level
  element **must** be specified in the ``content`` key.
* *nested*: The root element for a nested document. Nested documents **must** have an ``"xml:id"`` attribute that
  specifies the unique identifier for each nested document. This must be in the format
  ``nestedDocumentElementName-UniqueNumber``.
* *inline*: An inline element.
* *mark*: A formatting mark that is attached either to text or to an inline element.

The distinction between inline and mark elements is fluid, but in general you should prefer mark elements for formatting
and styling markup and inline elements to mark semantic content.

The ``attrs`` object maps attribute names (which can by any string value) to ``ElementAttribute`` configurations that
specify how the attribute is parsed and serialised.

Each ``TagElement`` **must** specify either a single ``parser`` or a list of ``parsers`` that specify which TEI tags
are mapped to this ``TagElement``. The ``serialiser`` entry configures how the ``TagElement`` is converted back into
a TEI tag.

The ``content`` **must** and **may only** be specified for a ``TagElement`` that has the ``type`` ``"wrapping"``. In
that case it **must** be set to the ``name`` of the ``TagElement`` that may be contained by the wrapping ``TagElement``.

The ``reference`` is specified for any ``TagElement`` that represents the reference to a nested document and specifies
how the two are linked together.

ElementAttribute
****************

The ``ElementAttribute`` specifies the default value for the attribute, how it is parsed and serialised:

.. sourcecode:: json

  {
    "default": "AnyString",
    "?parser": "ParserElement",
    "?parsers": ["ParserElement"],
    "serialiser": "SerialiserElement"
  }

As with the ``TagElement``, either a single ``parser`` or multiple ``parsers`` **must** be provided to specify how the
attribute is parsed from the TEI document.

Likewise the ``serialiser`` specifies how the attribute is serialised.

The ``default`` specifies the default value that is set for the attribute if no valid value can be parsed from the TEI
document.

NestedReferenceElement
**********************

Editing nested documents consists of two steps. First, the user needs to mark up the text that represents the reference
to the nested document. Then they need to edit the nested document. The ``NestedReferenceElement`` specifies the link
from the reference element to the nested document.

.. sourcecode:: json

  {
    "type": "ElementName",
    "attr": "AttributeName"
  }

The ``type`` specifies the ``name`` of the ``TagElement`` that represents the nested documents. The ``attr`` specifies
the attribute on the reference element that contains the nested document's unique identifier.

ParserElement
+++++++++++++

The ``ParserElement`` specifies how a ``TagElement`` or ``ElementAttribute`` is parsed from the TEI document.

.. sourcecode:: json

  {
    "selector": "XpathSelector",
    "?type": "static",
    "?value": "AnyString",
    "?text": "xpath-text-selector"
  }

The ``selector`` contains an XPath selector. The selector is configured to require the "tei" prefix on all TEI nodes,
for example "tei:head[@type=\"level-1\"]".

When used in the ``TagElement`` for inline or mark elements, the ``text`` **may** be used and contains a further XPath
selector that specfifies how the text content is to be parsed, relative to the TEI element selected via the ``selector``
XPath.

When used in the ``ElementAttribute``, the attribute's value by default is set to the result of the ``selector``.
However, if the ``type`` is specified with the value ``"static"``, then if the ``selector`` matches, the attribute's
value is set to the value specified in ``value``.

SerialiserElement
+++++++++++++++++

The ``SerialiserElement`` specifies how the ``TagElement`` or ``ElementAttribute`` are serialised.

.. sourcecode:: json

  {
    "?tag": "AnyString",
    "?attrs": {"AttributeName": "AnyString"},
    "?attr": "AnyString",
    "?value": "SubstitutedString"
  }

When used in the ``TagElement``, the ``tag`` is used to specify the TEI tag to serialise to. This **must** be prefixed
with ``"tei"``. In the use with the ``TagElement``, you can also use the ``attrs`` object to specify static attributes
that are serialised as specified here.

When used in the ``ElementAttribute``, the ``attr`` is used to specify the name of the attribute to serialise to and
the ``value`` is used to specify the serialised value. The ``value`` supports substitution, by including the special
value ``{value}``. By setting the ``value`` to ``"{value}"``, the attribute value specified by the user is serialised
as is. However, it is possible to also provide additional text that is serialised as static, for example ``"#{value}"``
prefixes the user-provided value with a #.

TextEditorUIElement
+++++++++++++++++++

The ``TextEditorUIElement`` is the root element for configuring the sidebar for the main and any nested documents.

.. sourcecode:: json

  {
    "doc | NestedElementName": ["TextEditorUISection"]
  }

For the main document, the key **must** be ``"doc"``. For nested documents, it **must** be the name of the nested
document ``TagElement``.

TextEditorUISection
*******************

The sidebar is configured as a list of ``TextEditorUISection`` elements that are then displayed vertically below each
other in the editor.

.. sourcecode:: json

  {
    "label": "AnyString",
    "entities": ["TextEditorUIBlock"],
    "?condition": "TextEditorUICondition"
  }

The ``label`` is displayed as the section heading. Each ``TextEditorUIBlock`` specified in the ``entities`` is then
shown in the specified order below the ``label``.

By default a ``TextEditorSection`` is always shown to the user. However, if the ``condition`` is specified, then this
changes and the default is that the ``TextEditorSection`` is hidden and only if the ``TextEditorUICondition`` holds,
is the ``TextEditorSection`` shown.

TextEditorUIBlock
*****************

The ``TextEditorUIBlock`` configures either a vertical list of input elements or a horizontal menubar.

.. sourcecode:: json

  {
    "?type": "menubar | list"
    "entities": ["TextEditorUIEntity"]
  }

The ``type`` **must** either be ``"menubar"`` or ``"list"``. Generally ``"list"`` is only used if you need to have
a text input element that needs a label.

The individual UI elements are configured via ``TextEditorUIEntity`` entries in the ``entities``.

TextEditorUIEntity
******************

The ``TextEditorUIEntity`` configures a single element that modifies the document.

.. sourcecode:: json

  {
    "type": "setNodeType | toggleMark | selectNodeAttr | setNodeAttrString | setNodeAttrNumber | setNodeAttrValue | toggleNodeAttrValue | selectMarkAttr | editNestedDoc | linkNestedDoc | closeNested"
    "label": "AnyHTMLString",
    "nodeType": "ElementName",
    "?ariaLabel": "AnyString",
    "?attr": "AttributeName",
    "?value": "AnyString",
    "?values": ["ValueLabelPair"],
    "?targetNodeType": "NestedElementName",
    "min?": "AnyNumber";
    "max?": "AnyNumber";
    "step?": "AnyNumber";
  }

The ``type`` configures the type of user-interface element to show and **must** be one of the following:

* *setNodeType*: Set the type of the current text block to the given ``nodeType``. If it is a ``block`` ``TagElement``
  then this sets the type for the complete block. If it is an ``inline`` ``TagElement``, then it is changed for the
  selection. In this case if the ``TagElement`` is already set, then it is removed. If it is a ``wrapping``
  ``TagElement``, then the current text block is set to the content ``TagElement`` and then wrapped in the wrapping
  ``TagElement``.
* *toggleMark*: Toggles the ``mark`` ``TagElement`` on or off.
* *selectNodeAttr*: Allows the user to select the ``TagElement`` attribute from a drop-down list. The attribute is
  specified via the ``attr`` and the potential values to select from via ``values``.
* *setNodeAttrString*: Allows the user to enter the ``TagElement`` attribute's value into a single-line text input. The
  attribute is specified via ``attr``.
* *setNodeAttrNumber*: Allows the user to enter the ``TagElement`` attribute's value into a single-line number input. The
  attribute is specified via ``attr``.
* *setNodeAttrValue*: Allows the user to set a fixed ``TagElement`` attribute value by clicking on a button. The
  attribute is specified via ``attr`` and the value to set via ``value``.
* *toggleNodeAttrValue*: Toggle the value ``value`` on the ``TagElement`` attribute. The attribute is specified via
  ``attr``.
* *selectMarkAttr*: Select a ``mark`` ``TagElement`` attribute value from a drop-down list. The attribute is specified
  via the ``attr`` and the potential values to select from via ``values``.
* *editNestedDoc*: Edit the nested document linked to the current ``inline`` ``TagElement``. The attribute that contains
  the unique identifier of the nested document to edit is specified via ``attr``, the type of nested document is
  specified via the ``targetNodeType``.
* *linkNestedDoc*: Select the linked nested document for the current ``inline`` ``TagElement`` from a drop-down list.
  The attribute that the unique identifier will be set in is specified via ``attr``. The type of nested document to
  link is specified via the ``targetNodeType``.
* *closeNested*: Closes the nested document editor.

The ``label`` is the label shown to the user and can by any HTML content. By providing HTML content, images can be
used as the label. If using an image for the ``label``, then you **must** provide an ``ariaLabel`` text for
accessibility reasons.

ValueLabelPair
**************

The ``ValueLabelPair`` is used to specify an entry for a drop-down list.

.. sourcecode:: json

  {
    "value": "AnyString",
    "label": "AnyString"
  }

The ``value`` is what is stored in the attribute, while the ``label`` is shown to the user.

TextEditorUICondition
*********************

The ``TextEditorUICondition`` is used to specify a condition under which a specific ``TextEditorUISection`` is
displayed.

.. sourcecode:: json

  {
    "type": "isActive",
    "activeType": "ElementName"
  }

The ``type`` attribute specifies the type of condition to check. Currently only a single type of condition is
implemented. ``"isActive"`` checks whether the ``TagElement`` set in the ``activeType`` is currently active.

MetadataEditorSection
---------------------

The ``MetadataEditorSection`` configures the metadata editor. Unlike the ``TextEditorSection``, of which there can be
multiple, there **must** only be one ``MetadataEditorSection``.

.. sourcecode:: json

  {
    "label": "AnyString",
    "type": "MetadataEditor",
    "schema": ["MetadataEditorElement"],
    "ui": ["MetadataEditorUISection"]
  }

The ``label`` can be any string value and is used in the UI to allow the user to navigate to this section. The ``type``
must be ``"MetadataEditor"``. The ``schema`` specifies how the metadata is parsed from and serialised to the TEI
document. The ``ui`` specifies how the metadata is displayed to the user.

MetadataEditorElement
+++++++++++++++++++++

The ``MetadataEditorElement`` is used to convert the TEI header into a tree-structure that is then edited via the
UI.

.. sourcecode:: json

  {
    "tag": "AnyString",
    "?children": ["MetadataEditorElement"],
    "?text": "DottedPath",
    "?multiple": "Boolean",
    "?attrs": {
      "AttributeName": "DottedPath"
    }
  }

The ``tag`` specifies the TEI tag that this ``MetadataEditorElement`` matches. If it matches, then if any ``children``
are specified, the matching is applied recursively.

If a ``text`` is specified and if the matched TEI tag has text content, then the text content is placed into the tree
structure at the location specified via the dotted path. If any attributes of the matched TEI element are to be set in
the tree, then these are specified in the ``attrs`` and if the attribute with the given ``AttributeName`` is set on
the TEI element, then that value is set in the tree at the position specified via the dotted path.

MetadataEditorUISection
+++++++++++++++++++++++

The ``MetadataEditorUISection`` is used to visually separate sections of the metadata to edit.

.. sourcecode:: json

  {
    "label": "AnyString",
    "entries": ["MetadataEditorUIElement"]
  }

The ``label`` is used as the heading that is displayed to the user. The ``entries`` define the editable UI elements.

MetadataEditorUIElement
***********************

The ``MetadataEditorUIElement`` is used to create the actual interface for editing the metadata.

.. sourcecode:: json

  {
    "type": "single-text | multi-field | multi-row",
    "label": "AnyString",
    "path": "DottedPath",
    "?entries": ["MetadataEditorUIElement"]
  }

The ``type`` specifies the type of editing interface and **must** be one of ``"single-text"``, ``"multi-field"``, or
``"multi-row"``. The ``label`` is used to label the input element. The ``path`` is a dotted path that specifies the
location in the tree of the metadata to edit. The optional ``entries`` allow nesting ``MetadataEditorUIElement`` to
enable editing complex metadata structures.

If the ``type`` is ``"single-text"``, then a simple text-input box is shown to the user. If the ``type`` is
``multi-row``, then the ``entries`` **must** be specified and define the ``MetadataEditorUIElement``\ s that make up
one row. If the ``type`` is ``multi-field`` then the ``entries`` **must** be specified and define the
``MetadataEditorUIElement``\ s that conceptually belong together.

In general the ``multi-field`` ``MetadataEditorUIElement`` are contained within ``multi-row``
``MetadataEditorUIElement``\ s.

The full path for accessing the metadata from the tree structure is calculated by concatenating all the ``path``
values for the nested ``MetadataEditorUIElement``\ s.
