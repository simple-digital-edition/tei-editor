###################################
Design Decisions (and Restrictions)
###################################

In order to create a graphical TEI editor that was usable across a wide range of projects, two big design decisions
were made to disallow mixed content and to limit the use of structural elements.

No mixed content
================

XML (which TEI is) creates a tree-structure of nested tags to represent its content. In a mixed content document, text
and child tags may appear at the same level:

.. sourcecode:: xml

  <p><place>Camelot</place> is a silly place.</p>

This kind of use reduces the number of tags and thus the effort when manually creating the XML. However, the consequence
of this is that it becomes impossible to distinguish when white-space is used to format the document for readability
or when it has actual semantic content:

.. sourcecode:: xml

  <p>
    <place>Camelot</place>
    is a silly place.
  </p>

The first line-break and spaces before the ``<place>`` tag are probably just formatting. The line-break and spaces
before the "is" should be compressed into a single space and the line-break after the full-stop can probably be ignored
again. However, none of these assumptions can be guaranteed to be true and may vary between files. This makes parsing
and interpreting TEI/XML tricky, making the application code much more complex. To avoid this, the TEI editor does
**not** support mixed content. Instead, text content that has meaning **may** only be contained in leaf nodes:

.. sourcecode:: xml

  <p>
    <place>Camelot</place>
    <seg> is a silly place.</seg>
  </p>

Obviously this requires using a "this is a text-block" tag (the example used the ``<seg>`` tag), which has the following
consequences:

* Increase the file-size. This is unavoidable, but can be mitigated through compression.
* Explicitly mark out content and formatting white-space.
* Allow for clean formatting of the TEI file.

Limited structural elements
===========================

The editor is built for graphical editing of TEI documents, in a manner similar to Word. It is difficult to create a
user-friendly and usable interface for editing non-visual structures (such as TEI's ``<div>``) in this context. As a
result the TEI editor only supports single-level basic structural elements, such as lists.

Other Restrictions
==================

Due to the JavaScript nature of the application, there is a performance limit to the size of TEI documents that can be
edited. In practice we have found that at about 40k words, performance when typing starts to reduce noticeably.

The TEI editor supports editing nested documents (for example footnotes or annotations). Due to the way this has been
implemented it requires a standardised format for the unique identifier for each nested document. The nested document's
identifier **must** be in the following format: ``nestedDocumentElementName-UniqueNumber``.
