Callbacks
=========

In addition to the static configuration, the TEI editor supports three JavaScript callbacks. To add callbacks, create
a new ``TEIEditor`` object on the ``window`` object:

.. sourcecode:: html

  <script type="application/javascript">
    window.TEIEditor = {
        callbacks: {
        }
    }
  </script>

There are three optional callbacks that can be defined on the ``callback`` object:

.. sourcecode:: html

  <script type="application/javascript">
    window.TEIEditor = {
        callbacks: {
            autoLoad: function(callback) {
            },
            load: function(callback) {
            },
            save: function(data) {
            }
        }
    }
  </script>

The ``autoLoad`` callback is called once after the TEI Editor has initialised itself. Use this if a TEI document
should be loaded automatically on initialisation. The TEI document **must** be passed as a string to the ``callback``
function parameter.

The ``load`` callback is called if the user clicks on the "Load" menu item. After loading the new TEI document, it
**must** be passed as a string to the ``callback`` function parameter.

The ``save`` callback is called with the TEI document to save in the ``data`` parameter.
