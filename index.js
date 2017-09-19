const _ = require('lodash');
const reqwest = require('reqwest');
const moment = require('moment');

const osmHistory = (function osmDeepHistory() {
    const baseUrl = '//api.openstreetmap.org/api/0.6/';

    const osmObjects = {
        node: {},
        way: {},
        relation: {}
    }

    const s = {};

    // reqwest doesn't support promise chaining, has to wrap it
    function requestOsmApi(url) {
        console.log('Request OSM API', url);
        return new Promise((resolve, reject) => {
            reqwest({
                url,
                crossOrigin: true,
                type: 'xml',
                success: resolve,
                error: reject
            });
        });
    }


    function getObjVersionByDate(type, id, timestamp) {
        const versions = osmObjects[type][id];
        for (let i = versions.length - 1; i >= 0; i--) {
            if (versions[i].timestamp.isSameOrBefore(timestamp)) {
                return versions[i];
            }
        }
        return versions[0];
    }

    s.requestReferenceHistoryForWay = function (id) /* => Promise<void> */ {
        const way = osmObjects['way'][id];
        if (!way) {
            return Promise.reject("Can't request reference for unknown way");
        }
        const node_ids = _.uniq(_.flatMap(way, v => v.nodes));
        return Promise
            .all(_.map(node_ids, id => s.getObjectHistory('node', id)))
            .then(r => { return; });
    }

    s.getWayHistoryFull = function (way_obj) {
        return _.map(way_obj, v => {
            return {
                version: v.version,
                latlons: _.map(v.nodes, id => {
                    const node = getObjVersionByDate('node', id, v.timestamp);
                    return [node.lat, node.lon];
                })
            };
        });
    };

    s.getWayHistoryByDate = function (id, timestamp) {
        const way = getObjVersionByDate('way', id, timestamp);
        return {
            way,
            nodes: _.map(way.nodes, nid => getObjVersionByDate('node', nid, timestamp))
        }
    };

    function xmlElementToObj(e) {
        const obj = {
            type: e.tagName,
            user: e.getAttribute('user'),
            timestamp: moment(e.getAttribute('timestamp')),
            changeset: +e.getAttribute('changeset'),
            version: +e.getAttribute('version'),
            id: +e.getAttribute('id'),
            tags: _.fromPairs(_.map(e.getElementsByTagName('tag'), t => [t.getAttribute('k'), t.getAttribute('v')])),
            visible: (e.getAttribute('visible') === 'true')
        };
        switch (obj.type) {
            case 'node':
                obj.lat = +e.getAttribute('lat');
                obj.lon = +e.getAttribute('lon');
                break;
            case 'way':
                obj.nodes = _.map(e.getElementsByTagName('nd'), e => e.getAttribute('ref'));
                break;
            case 'relation':
                obj.members = _.map(e.getElementsByTagName('member'), e => {
                    return {
                        type: e.getAttribute('type'),
                        ref: e.getAttribute('ref'),
                        role: e.getAttribute('role')
                    }
                });
        }
        return obj;
    }

    s.getObjectHistory = function (obj_type, obj_id) {
        console.log('Get history of', obj_type, obj_id);
        if (osmObjects[obj_type][obj_id]) {
            return Promise.resolve(osmObjects[obj_type][obj_id]);
        } else {
            return requestOsmApi(baseUrl + obj_type + '/' + obj_id + '/history')
                .then(xml => {
                    const objHistory = _.map(xml.getElementsByTagName(obj_type), xmlElementToObj);
                    osmObjects[obj_type][obj_id] = objHistory;
                    return objHistory;
                });
        }
    };

    function requestWayFull(way_id) /* => Promise<Array<[lat, lon]>> */ {
        return requestOsmApi(baseUrl + 'way/' + way_id + '/full')
            .then(x => {
                const nodes =
                    _.keyBy(
                        _.map(x.getElementsByTagName('node'), e => {
                            return {
                                id: e.getAttribute('id'),
                                lat: e.getAttribute('lat'),
                                lon: e.getAttribute('lon'),
                            };
                        }),
                        'id');
                return {
                    id: way_id,
                    latlons: _.map(x.getElementsByTagName('nd'), e => e.getAttribute('ref'))
                        .map(id => {
                            const n = nodes[id];
                            return [n.lat, n.lon];
                        })
                };
            });
    }

    s.getWaysNodeBelongsTo = function (node_id) /* => Promise */ {
        return requestOsmApi(baseUrl + 'node/' + node_id + '/ways')
            .then(x => {
                return Promise.all(
                    _.map(x.getElementsByTagName('way'), e => e.getAttribute('id'))
                        .map(requestWayFull));
            });
    }

    return s;
})();

module.exports = osmHistory;
