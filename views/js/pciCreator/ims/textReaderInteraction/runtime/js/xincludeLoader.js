/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA;
 */

define(['jquery', 'lodash', 'taoQtiItem/qtiItem/helper/simpleParser', 'taoQtiItem/qtiItem/core/Loader'], function ($, _, simpleParser, Loader) {
    'use strict';

    const xincludeLoader = {
        name: 'xincludeLoader',
        load: function load(xinclude, baseUrl, callback) {
            const href = xinclude.attr('href');
            if (href && baseUrl) {
                const fileUrl = `text!${baseUrl}${href}`;
                // reset the previous definition of the XML, to receive updated passage
                require.undef(fileUrl);
                // require xml
                require([fileUrl], function (stimulusXml) {
                    const $wrapper = $.parseXML(stimulusXml);
                    const $sampleXMLrootNode = $wrapper.children;
                    const $stimulus = $('<include>').append($sampleXMLrootNode);
                    const mathNs = 'm'; //for 'http://www.w3.org/1998/Math/MathML'
                    const data = simpleParser.parse($stimulus, {
                        ns: {
                            math: mathNs
                        }
                    });
                    callback(xinclude, data);
                }, function () {
                    //in case the file does not exist
                    callback(xinclude, false);
                });
            }
        }
    };
    return xincludeLoader;
});
