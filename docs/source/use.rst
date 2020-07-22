Use
===

The TEI Editor can be used as a stand-alone application or as a component within a larger Vue.js application.

Stand-alone
###########

To use the TEI Editor as a stand-alone application, create a new file ``tei-editor.html`` with the following content:

.. code-block:: html

   <!DOCTYPE html>
   <html>
     <head>
       <title>TEI Editor</title>
       <link rel="stylesheet" href="css/app.css"/>
     </head>
     <body>
       <div id="app"></div>
       <script id="TEIEditorConfig" type="application/json">
       </script>
       <script src="js/chunk-vendors.js"></script>
       <script src="js/app.js"></script>
     </body>
   </html>

Then copy the ``js`` and ``css`` directories from the ``tei-editor/dist`` directory.

Finally, into the ``<script id="TEIEditorConfig">`` tag add the configuration as documented
`here <configuration-data>`_.

If you wish to automatically load a TEI document, add the following before the ``<script src="js/chunk-vendors.js">`` tag:

.. code-block:: html

   <script id="TEIEditorData" type="application/xml+tei">
   </script>

Then add the TEI to load into that element.

Vue.js Component
################

Documentation to follow.
