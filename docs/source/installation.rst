############
Installation
############

The TEI Editor is available as an NPM package and can be installed via::

  npm install -s tei-editor

or::

  yarn add tei-editor

Use
===

To use the ``tei-editor`` in your project, the ``tei-editor/dist`` directory contains all required JavaScript files
in the ``js`` directory. Make sure that in your HTML you include the ``chunk-vendors.js`` file before including the
``app.js``. It is also recommended that you include the ``css/app.css`` file, which provides the basic structural
formatting.

Alternatively, the full source-code can be included from the ``src`` directory, if you want to include the application
directly into the source-code of your project.
