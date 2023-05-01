const async = require('async');
const helpers = require('../../../helpers/azure');

module.exports = {
    title: 'PostgreSQL Server Access to Azure Services Disabled',
    category: 'PostgreSQL Server',
    domain: 'Databases',
    description: 'Ensure that Allow access to Azure services for PostgreSQL Database Server is disabled.',
    more_info: 'If access from Azure services is enabled, the server\'s firewall will accept connections from all Azure resources, including resources not in your subscription. This is usually not a desired configuration. Instead, set up firewall rules to allow access from specific network ranges or VNET rules to allow access from specific virtual networks.',
    recommended_action: 'Disable network access to the public for PostgreSQL database servers.',
    link: 'https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-firewall-rules',
    apis: ['servers:listPostgres'],

    run: function(cache, settings, callback) {
        const results = [];
        const source = {};
        const locations = helpers.locations(settings.govcloud);

        async.each(locations.servers, (location, rcb) => {

            const servers = helpers.addSource(cache, source,
                ['servers', 'listPostgres', location]);

            if (!servers) return rcb();

            if (servers.err || !servers.data) {
                helpers.addResult(results, 3,
                    'Unable to query for PostgreSQL Servers: ' + helpers.addError(servers), location);
                return rcb();
            }

            if (!servers.data.length) {
                helpers.addResult(results, 0, 'No existing PostgreSQL Servers found', location);
                return rcb();
            }

            for (let postgresServer of servers.data) {
                if (postgresServer.properties &&
                    postgresServer.properties.publicNetworkAccess &&
                    postgresServer.properties.publicNetworkAccess.toUpperCase() === 'DISABLED') {
                    helpers.addResult(results, 0,
                        'The PostgreSQL Server has public network access disabled', location, postgresServer.id);
                } else {
                    helpers.addResult(results, 2,
                        'The PostgreSQL Server does not have public network access disabled', location, postgresServer.id);
                }
            }

            rcb();
        }, function() {
            // Global checking goes here
            callback(null, results, source);
        });
    }
};
