define([
    'jquery',
    'lodash',
    'taoQtiItem/runner/qtiItemRunner',
    'taoQtiItem/portableElementRegistry/ciRegistry',
    'taoQtiItem/portableElementRegistry/provider/localManifestProvider',
    'json!pciSamples/pciCreator/dev/textReaderInteraction/test/data/qti.json'
], function ($, _, qtiItemRunner, ciRegistry, pciTestProvider, itemData){
    'use strict';

    var runner;

    //manually register the pci from its manifest
    pciTestProvider.addManifestPath(
        'textReaderInteraction',
        'pciSamples/pciCreator/dev/textReaderInteraction/pciCreator.json');
    ciRegistry.resetProviders();
    ciRegistry.registerProvider(pciTestProvider.getModuleName());

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
            .init()
            .render($container);
    });

});

