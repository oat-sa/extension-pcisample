define([
    'jquery',
    'lodash',
    'taoQtiItem/runner/qtiItemRunner',
    'json!pciSamples/pciCreator/dev/textReaderInteraction/test/data/qti.json'
], function ($, _, qtiItemRunner, itemData){

    'use strict';

    var runner;

    //override asset loading in order to resolve it from the runtime location
    var strategies = [{
        name : 'portableElementLocation',
        handle : function handlePortableElementLocation(url){
            if(/textReaderInteraction/.test(url.toString())){
                return '../../../pciSamples/views/js/pciCreator/dev/' + url.toString();
            }
        }
    }, {
        name : 'default',
        handle : function defaultStrategy(url){
            return url.toString();
        }
    }];

    module('Text Reader Interaction');

    QUnit.asyncTest('display and play', function (assert){

        var $container = $('#outside-container');
        assert.equal($container.length, 1, 'the item container exists');

        runner = qtiItemRunner('qti', itemData)
            .on('render', function (){
                QUnit.start();
            })
            .on('error', function (error){
                $('#error-display').html(error);
            })
            .assets(strategies)
            .init()
            .render($container);
    });

});

