'use strict';

const GlimmerApp = require('@glimmer/application-pipeline').GlimmerApp;

module.exports = function(defaults) {
    let app = new GlimmerApp(defaults, {
        sassOptions: {
            includePaths: [
                'node_modules/foundation-sites/scss'
            ]
        }
    });

    return app.toTree();
};
